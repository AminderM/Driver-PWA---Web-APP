# Backend Developer Instructions
## Driver PWA — Changes Required to Support Frontend Fixes

This document outlines every backend change needed to fully support the frontend fixes applied to
the Integra Driver PWA before its Android release. Items are ordered by severity.

---

## 1. Authentication & Token Handling

### 1.1 — Always Return `401` for Expired / Invalid Tokens (CRITICAL)

**Why:** The frontend now auto-calls `logout()` and redirects the driver to the login screen whenever
it receives a `401`. If the backend returns `400`, `403`, or `422` for expired tokens instead of
`401`, the driver will see a generic error message and remain stuck on a broken screen.

**Required behaviour:**
- Every protected endpoint must return HTTP `401 Unauthorized` when:
  - The `Authorization: Bearer <token>` header is missing
  - The JWT is expired
  - The JWT signature is invalid
  - The JWT subject/user no longer exists
- Return `403 Forbidden` **only** when the token is valid but the user lacks permission for that
  specific resource.
- Never return `400 Bad Request` for auth failures.

**Response body expected by the frontend:**
```json
{ "detail": "Token expired or invalid." }
```

---

### 1.2 — Push Notification Device Token Registration (NEW ENDPOINT)

**Why:** The frontend now calls `registerForPushNotifications()` immediately after every login and
signup. The returned FCM/APNs device token must be stored on the backend so dispatch can send
targeted push notifications to specific drivers.

**New endpoint required:**

```
POST /api/driver-mobile/device-token
Authorization: Bearer <jwt>
Content-Type: application/json

Body:
{
  "push_token": "fcm_or_apns_token_string",
  "platform": "android" | "ios"
}

Response 200:
{ "status": "registered" }
```

**Notes:**
- A driver may have multiple active tokens (multiple devices). Store all of them; do not replace.
- Delete or mark stale tokens when delivery fails (FCM returns `InvalidRegistration`).
- This endpoint will be called on every app launch after login, so it must be idempotent — if the
  same token is sent twice, do not create a duplicate.

---

### 1.3 — Password Policy Enforcement (CRITICAL for signup)

**Why:** The frontend now enforces stricter password rules on signup:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number

The backend **must enforce the same rules server-side** — client validation alone is never
sufficient. Drivers who call the API directly or through older app versions would otherwise create
weak passwords.

**Endpoints affected:**
- `POST /api/driver-mobile/signup`
- `POST /api/driver-mobile/signup/open`
- `POST /api/driver-mobile/reset-password`

**Return on violation:**
```json
HTTP 422
{
  "detail": "Password must be at least 8 characters and contain at least one uppercase letter and one number."
}
```

---

## 2. Location Ping Endpoint

### 2.1 — Improve `/location/ping` Reliability & Response

**Why:** The frontend tracks consecutive ping failures. After 2 failures it shows a warning banner
to the driver ("LOCATION UPDATES FAILING"). The frontend uses an 8-second `AbortController` timeout
on each ping.

**Requirements for `POST /api/driver-mobile/location/ping`:**

1. **Must respond within 8 seconds** — if it takes longer, the frontend will abort the request and
   count it as a failure.
2. **Always return `200`** on success — even if the driver has no active load. Do not return `404`
   when there is no `load_id` on the body.
3. **Accept the following body:**
```json
{
  "lat": 43.6532,
  "lng": -79.3832,
  "accuracy_m": 12.5,
  "load_id": "uuid-or-null"
}
```
4. **`load_id` is nullable** — do not reject pings that have `"load_id": null`.
5. **Return a lightweight response** — the frontend ignores the body, so keep it minimal:
```json
{ "status": "ok" }
```

---

## 3. Document Upload Endpoints

### 3.1 — Return Descriptive Error Messages on Upload Failure

**Why:** The frontend now shows the exact `error.detail` string to the driver when an upload fails,
with a **Retry** button. Previously it swallowed the error with "will sync later". If the backend
returns a vague or missing error body, the driver will see "Upload failed" with no actionable info.

**Endpoints affected:**
- `POST /api/driver-mobile/documents/scan`
- `POST /api/driver-mobile/loads/{loadId}/documents`

**Return clear human-readable errors, for example:**
```json
HTTP 413
{ "detail": "File is too large. Maximum allowed size is 10 MB." }

HTTP 415
{ "detail": "Unsupported file type. Please upload a JPEG, PNG, or PDF." }

HTTP 422
{ "detail": "Document type is required." }
```

**Successful response** must include the updated user object so the frontend can sync the profile:
```json
HTTP 200
{
  "document": { "id": "...", "document_type": "drivers_license", "url": "..." },
  "user": { ...full user object... }
}
```

---

### 3.2 — Document Vault Endpoints

The `DocumentVaultScreen` calls these endpoints. Ensure they exist and match this interface:

```
GET    /api/driver-mobile/vault/documents          → list of documents
POST   /api/driver-mobile/vault/documents          → upload (multipart/form-data)
DELETE /api/driver-mobile/vault/documents/{docId}  → delete
```

---

## 4. Chat / Messages

### 4.1 — Messages Endpoint Must Handle High Poll Frequency Gracefully

**Why:** The frontend polls `GET /api/driver-mobile/loads/{loadId}/messages` every 10 seconds under
normal conditions, backing off exponentially to 60 seconds on repeated errors, and stopping
entirely after 5 consecutive failures.

**Requirements:**
1. The endpoint must respond within **5 seconds** to avoid triggering the `AbortController` timeout.
2. Return an **empty array** (not `404`) when there are no messages yet:
```json
HTTP 200
[]
```
3. Return `404` **only** if the load itself does not exist — not if it just has no messages.
4. Consider adding ETag / `If-None-Match` support for future bandwidth optimisation.

---

### 4.2 — Send Message Response Format

`POST /api/driver-mobile/loads/{loadId}/messages`

The frontend expects the response to wrap the new message inside a `data` key:
```json
HTTP 201
{
  "data": {
    "id": "uuid",
    "content": "Message text",
    "sender_type": "driver",
    "sender_name": "John Smith",
    "created_at": "2026-05-30T14:22:00Z"
  }
}
```

---

## 5. OTP / Phone Authentication

### 5.1 — Enforce Server-Side OTP Resend Rate Limiting

**Why:** The frontend now persists a 60-second resend cooldown in `sessionStorage`, but this is a
UX hint only — a driver with a modified app or API client can still call the endpoint repeatedly.

**Required:**
- `POST /api/driver-mobile/auth/phone/request-otp` must enforce a **60-second cooldown per phone
  number** server-side.
- On repeated requests within the cooldown window, return:
```json
HTTP 429
{
  "detail": "Please wait 60 seconds before requesting another code.",
  "retry_after_seconds": 42
}
```
- Include a `Retry-After` HTTP header as well.

---

### 5.2 — OTP Expiry

- OTP codes must expire after **10 minutes**.
- After expiry, return:
```json
HTTP 410
{ "detail": "Verification code has expired. Please request a new one." }
```

---

## 6. Load Data

### 6.1 — Status Strings Must Match Exactly

**Why:** The frontend uses these exact strings in `STATUS_CONFIG` and the new `LOAD_STATUS`
constants file. Any deviation will cause loads to show as "Assigned" (the fallback) regardless of
their real state.

**Confirmed status values the backend must use:**

| Status string | Meaning |
|---|---|
| `available` | Load is available to be accepted by a driver |
| `assigned` | Assigned to driver, not yet started |
| `pending` | Awaiting driver acknowledgement |
| `en_route_pickup` | Driver is driving to pickup |
| `arrived_pickup` | Driver has arrived at pickup |
| `loaded` | Freight loaded, about to depart |
| `en_route_delivery` | Driver is driving to delivery |
| `arrived_delivery` | Driver has arrived at delivery |
| `delivered` | Delivery complete |
| `rejected` | Driver rejected this load |
| `problem` | Driver reported a problem |

Do **not** use the legacy aliases (`in_transit_pickup`, `at_pickup`, `in_transit_delivery`,
`at_delivery`, `planned`) for new loads — the frontend maps these but they will be removed in a
future cleanup.

---

### 6.2 — Include Coordinates in Load Response (Future Map Improvement)

**Why:** The map currently uses a hardcoded city lookup table (25 US cities) with a rough straight-
line distance calculation. For accurate route display, loads should include geocoded coordinates.

**Recommended addition to the load response object:**
```json
{
  "id": "uuid",
  "order_number": "ORD-001",
  "status": "assigned",
  ...existing fields...,
  "pickup_lat": 43.6532,
  "pickup_lng": -79.3832,
  "delivery_lat": 42.3314,
  "delivery_lng": -83.0458,
  "estimated_miles": 220,
  "estimated_hours": 4
}
```

If these fields are present the frontend map will use them directly. If absent it falls back to the
city lookup table (current behaviour). This is a **non-breaking, additive change**.

---

### 6.3 — Load Accept / Reject Endpoints

`MyLoadsScreen` calls accept first, then falls back to a status update if the accept endpoint
returns an error. Please confirm both work:

```
POST /api/driver-mobile/loads/{loadId}/accept
Body: { "accepted": true }
→ HTTP 200 { "load": {...updated load...} }

POST /api/driver-mobile/loads/{loadId}/reject
Body: { "rejected": true, "reason": "Driver rejected" }
→ HTTP 200 { "load": {...updated load...} }
```

---

## 7. Profile & Licence Enforcement

### 7.1 — Block Load Assignment for Drivers with Expired Licences

**Why:** The frontend shows an "EXPIRED" badge on licences but does not currently block drivers from
accepting loads. The backend must be the enforcement point.

**Required:**
- When a driver calls `POST /api/driver-mobile/loads/{loadId}/accept` or updates their status to
  `en_route_pickup`, check whether their `drivers_license` document has an `expiry_date` in the
  past.
- If expired, return:
```json
HTTP 403
{
  "detail": "Your driver's licence has expired. Please upload a valid licence before accepting loads."
}
```
- The same check should apply to `medical_card` if it is a required document for the carrier.

---

### 7.2 — User Object Must Include `phone_verified` Field

**Why:** The frontend reads `user.phone_verified` on every render. If this field is absent
(`undefined`), the frontend treats it as verified (`!== false`). Include it explicitly in all
responses that return a user object.

```json
{
  "id": "uuid",
  "full_name": "John Smith",
  "email": "john@example.com",
  "user_type": "driver",
  "phone_verified": true,
  "first_login": false,
  ...
}
```

---

## 8. Error Response Format — Global Standard

**Why:** The frontend's `api()` helper parses `error.detail` from every non-2xx response. If the
backend uses a different key (`message`, `error`, `msg`) the frontend falls back to the generic
"Request failed" string and the driver gets no useful info.

**All error responses must follow this format:**
```json
HTTP 4xx / 5xx
{
  "detail": "Human-readable error message shown to the driver."
}
```

For validation errors (FastAPI default), each item in the `detail` array must have a `msg` key:
```json
HTTP 422
{
  "detail": [
    { "loc": ["body", "phone"], "msg": "Phone number is required.", "type": "value_error" }
  ]
}
```

The frontend joins multiple `detail` items with ". " and shows the result as a single string.

---

## 9. API Response Time Budget

**Why:** The frontend now uses `AbortController` with a **15-second timeout** on all `api()` calls,
and an **8-second timeout** on location pings. Any endpoint that exceeds these limits will return a
"Request timed out" error to the driver.

| Endpoint type | Max response time |
|---|---|
| Location ping | **8 seconds** |
| All other API calls | **15 seconds** |
| File uploads (documents) | 15 seconds per call — compress if needed |

If background processing is required (e.g. AI parsing, OCR), return `202 Accepted` immediately
with a job ID and provide a polling endpoint. Do not hold the connection open.

---

## 10. Summary Checklist

Use this as a sign-off checklist before the Android release.

### Must-Have (Blocking Release)
- [ ] `401` returned consistently for all expired/invalid token scenarios
- [ ] `POST /api/driver-mobile/device-token` endpoint created and functional
- [ ] Password policy enforced server-side (min 8 chars, 1 uppercase, 1 number) on all signup/reset endpoints
- [ ] `POST /api/driver-mobile/location/ping` responds within 8 seconds, accepts `null` load_id
- [ ] Document upload endpoints return descriptive `detail` error messages
- [ ] `GET /api/driver-mobile/loads/{loadId}/messages` returns `[]` (not `404`) when no messages exist
- [ ] OTP resend rate limiting (60 seconds) enforced server-side with `429` response

### Should-Have (High Priority)
- [ ] All load status strings match the table in Section 6.1 exactly
- [ ] `user.phone_verified` field included in all user object responses
- [ ] All error responses use `{ "detail": "..." }` format
- [ ] Send message `POST /loads/{loadId}/messages` response wraps data in `{ "data": {...} }`
- [ ] Load accept/reject endpoints confirmed functional

### Nice-to-Have (Can Ship Without)
- [ ] `pickup_lat`, `pickup_lng`, `delivery_lat`, `delivery_lng`, `estimated_miles` added to load response
- [ ] Expired licence check blocks load acceptance (`403` with clear message)
- [ ] ETag support on `GET /loads/{loadId}/messages` to reduce polling bandwidth
- [ ] `retry_after_seconds` included in `429` OTP rate-limit response

---

*Generated from frontend fixes applied — May 30, 2026*
*Frontend repo: Driver-PWA---Web-APP, branch: fixes-may5th*
