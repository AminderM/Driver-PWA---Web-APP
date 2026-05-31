# Backend Developer Instructions
## Integra Driver PWA — Full API Specification

This document is the authoritative reference for every backend endpoint, response format, and
behaviour required to support the Integra Driver PWA (Android + iOS + Web).

**Base path for all endpoints:** `/api/driver-mobile`
**Authentication:** `Authorization: Bearer <jwt>` on every protected endpoint
**Content-Type:** `application/json` unless noted as `multipart/form-data`
**Error format:** Always `{ "detail": "..." }` — see Section 10

---

## 1. Authentication & Token Handling

### 1.1 — Return `401` for All Expired / Invalid Tokens (CRITICAL)

The frontend `api()` helper auto-calls `logout()` and redirects to the login screen on any `401`.
If the backend returns `400`, `403`, or `422` instead of `401` for auth failures, the driver gets
stuck on a broken screen with a generic error.

**Rules:**
- Return `401 Unauthorized` when:
  - `Authorization` header is missing
  - JWT is expired
  - JWT signature is invalid
  - JWT subject no longer exists in the database
- Return `403 Forbidden` **only** when the token is valid but the user lacks permission for that specific resource
- Never return `400 Bad Request` for auth failures

```json
HTTP 401
{ "detail": "Token expired or invalid." }
```

---

### 1.2 — Login & Signup Responses

Every login and signup response must return the full user object. The frontend reads these fields
immediately after authentication.

```json
HTTP 200
{
  "token": "jwt_string",
  "user": {
    "id": "uuid",
    "full_name": "John Smith",
    "email": "john@example.com",
    "phone": "+14165550123",
    "user_type": "driver",              // "driver" | "owner_operator" | "carrier"
    "phone_verified": true,             // REQUIRED — see Section 8.2
    "first_login": false,
    "profile_complete": true,
    "required_documents": [],
    "logo_url": null,
    "trial_ends_at": "2026-06-13T00:00:00Z",
    "subscription_status": "trial"      // "trial" | "active" | "expired"
  }
}
```

---

### 1.3 — Push Notification Device Token Registration (NEW ENDPOINT)

The frontend calls `registerForPushNotifications()` immediately after every login and signup and
POSTs the resulting FCM/APNs token here.

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

**Rules:**
- A driver may have multiple devices. Store all tokens; do not replace old ones.
- Mark tokens as stale / delete them when FCM returns `InvalidRegistration` on delivery.
- Idempotent — if the same token is submitted twice, do not create a duplicate.

---

### 1.4 — Password Policy Enforcement (CRITICAL)

The frontend enforces these rules on signup and reset — the backend must enforce them server-side
on every call, regardless of client version.

**Minimum requirements:**
- At least 8 characters
- At least 1 uppercase letter
- At least 1 number

**Endpoints affected:**
- `POST /api/driver-mobile/signup`
- `POST /api/driver-mobile/signup/open`
- `POST /api/driver-mobile/reset-password`

```json
HTTP 422
{
  "detail": "Password must be at least 8 characters and contain at least one uppercase letter and one number."
}
```

---

### 1.5 — Invite Validation

```
GET /api/driver-mobile/signup/validate-invite?token=<invite_token>

Response 200:
{
  "full_name": "John Smith",
  "driver_email": "john@example.com",
  "company_name": "Acme Trucking",
  "user_type": "driver"
}

Response 404 / 410:
{ "detail": "This invite link is invalid or has expired." }
```

---

## 2. OTP / Phone Authentication

### 2.1 — Request OTP

```
POST /api/driver-mobile/auth/phone/request-otp
Content-Type: application/json

Body: { "phone": "+14165550123" }

Response 200: { "status": "sent" }

Response 429 (rate limited):
{
  "detail": "Please wait 60 seconds before requesting another code.",
  "retry_after_seconds": 42
}
```

**Rules:**
- Enforce a **60-second cooldown per phone number** server-side. The frontend shows a countdown
  timer but a driver with a modified client can bypass it.
- Include `Retry-After: 42` HTTP header alongside the `429` body.

---

### 2.2 — Verify OTP

```
POST /api/driver-mobile/auth/phone/verify-otp
Content-Type: application/json

Body: { "phone": "+14165550123", "code": "123456" }

Response 200: { "status": "verified" }

Response 410 (expired):
{ "detail": "Verification code has expired. Please request a new one." }

Response 400 (wrong code):
{ "detail": "Incorrect verification code." }
```

**Rules:**
- OTP codes expire after **10 minutes**.

---

## 3. Location Tracking

### 3.1 — Location Ping

The frontend sends a ping every 30 seconds while the driver has an active load. After 2 consecutive
failures it shows a "LOCATION UPDATES FAILING" warning banner. The `AbortController` timeout is
**8 seconds** — if the endpoint takes longer the ping is counted as failed.

```
POST /api/driver-mobile/location/ping
Authorization: Bearer <jwt>
Content-Type: application/json

Body:
{
  "lat": 43.6532,
  "lng": -79.3832,
  "accuracy_m": 12.5,
  "load_id": "uuid-or-null"
}

Response 200:
{ "status": "ok" }
```

**Rules:**
- Must respond within **8 seconds**.
- Always return `200` — even when `load_id` is `null` or the driver has no active load.
- Never return `404` for a missing load on this endpoint.
- `load_id` is nullable. Do not reject pings where `"load_id": null`.

---

## 4. Loads — Dispatched (TMS-assigned)

### 4.1 — List Loads

```
GET /api/driver-mobile/loads
Authorization: Bearer <jwt>

Response 200: [ ...load objects... ]
```

**Load object fields:**

```json
{
  "id": "uuid",
  "order_number": "ORD-001",
  "status": "en_route_pickup",
  "origin": "Toronto, ON",
  "destination": "Calgary, AB",
  "pickup_date": "2026-06-01",
  "delivery_date": "2026-06-03",
  "rate": 2500,
  "estimated_miles": 2120,
  "commodity": "Auto parts",
  "broker_name": "Echo Global Logistics",
  "shipper": "Magna International",
  "consignee": "Toyota Assembly",
  "pickup_city": "Toronto",
  "delivery_city": "Calgary",
  "pickup_lat": 43.6532,
  "pickup_lng": -79.3832,
  "delivery_lat": 51.0447,
  "delivery_lng": -114.0719,
  "estimated_hours": 22,
  "weight": 42000,
  "trailer_type": "dry_van"
}
```

**Status string reference** — must match exactly (case-sensitive, snake_case):

| Value | Meaning |
|---|---|
| `available` | Load available for driver to accept |
| `assigned` | Assigned, not yet started |
| `pending` | Awaiting driver acknowledgement |
| `en_route_pickup` | Driving to pickup |
| `arrived_pickup` | At pickup location |
| `loaded` | Freight loaded, departing |
| `en_route_delivery` | Driving to delivery |
| `arrived_delivery` | At delivery location |
| `delivered` | Delivery complete |
| `rejected` | Driver rejected |
| `problem` | Driver reported a problem |

Do **not** use legacy aliases (`in_transit_pickup`, `at_pickup`, `in_transit_delivery`,
`at_delivery`, `planned`).

---

### 4.2 — Accept / Reject Load

```
POST /api/driver-mobile/loads/{loadId}/accept
Body: { "accepted": true }
→ HTTP 200 { "load": { ...updated load object... } }

POST /api/driver-mobile/loads/{loadId}/reject
Body: { "rejected": true, "reason": "Driver rejected" }
→ HTTP 200 { "load": { ...updated load object... } }
```

**Licence check:** When a driver calls `accept` or updates status to `en_route_pickup`, verify their
`drivers_license` and `medical_card` documents are not expired. If expired:

```json
HTTP 403
{
  "detail": "Your driver's licence has expired. Please upload a valid licence before accepting loads."
}
```

---

### 4.3 — Update Load Status

```
PATCH /api/driver-mobile/loads/{loadId}/status
Body: { "status": "arrived_pickup" }
→ HTTP 200 { "load": { ...updated load object... } }
```

---

### 4.4 — Load Documents (Dispatched Loads)

Attach paperwork (BOL, delivery photos, etc.) to a specific TMS load:

```
GET  /api/driver-mobile/loads/{loadId}/documents
→ HTTP 200 [ { "id": "uuid", "document_type": "bol", "url": "...", "created_at": "..." } ]

POST /api/driver-mobile/loads/{loadId}/documents
Content-Type: multipart/form-data
Body:
  - file: <image or pdf>
  - document_type: "bol" | "delivery_photo" | "exception_photo" | "other"

→ HTTP 200 {
    "document": { "id": "...", "document_type": "bol", "url": "..." },
    "user": { ...full user object... }
  }
```

**Error responses:**
```json
HTTP 413 { "detail": "File is too large. Maximum allowed size is 10 MB." }
HTTP 415 { "detail": "Unsupported file type. Please upload a JPEG, PNG, or PDF." }
HTTP 422 { "detail": "Document type is required." }
```

---

## 5. Loads — Manual (Owner-Operator self-entered)

Owner-operators and carriers log their own loads independently of the TMS dispatch system.

### 5.1 — CRUD

```
GET    /api/driver-mobile/my-loads
→ HTTP 200 [ ...load objects... ]

POST   /api/driver-mobile/my-loads
Body: { origin, destination, pickup_date, delivery_date, rate, estimated_miles,
        status, broker_name, commodity, ... }
→ HTTP 201 { ...load object... }

PATCH  /api/driver-mobile/my-loads/{id}
Body: { any fields to update, e.g. "paid_amount": 2500 }
→ HTTP 200 { ...load object... }

DELETE /api/driver-mobile/my-loads/{id}
→ HTTP 200 { "status": "deleted" }
```

**Manual load status values:** `upcoming` | `in_transit` | `delivered` | `invoiced`

**Load object must include:**
```json
{
  "id": "uuid",
  "status": "invoiced",
  "origin": "Toronto, ON",
  "destination": "Calgary, AB",
  "pickup_date": "2026-05-29",
  "rate": 2500,
  "estimated_miles": 2120,
  "paid_amount": 0,
  "broker_name": "Echo Global Logistics",
  "commodity": "Auto parts"
}
```

**`paid_amount` field:** Tracks collected payment. When a driver records payment via the "RECORD
PAYMENT" button, the frontend sends `PATCH /my-loads/{id}` with `{ "paid_amount": 2500 }`.

---

### 5.2 — Rate Confirmation Parsing (AI)

Parses a rate confirmation image using AI (DeepSeek) and extracts structured load data.

```
POST /api/driver-mobile/rate-con/parse
Content-Type: multipart/form-data
Body: file: <image or PDF of rate confirmation>

Response 200:
{
  "shipper": "Magna International",
  "consignee": "Toyota Assembly Plant",
  "origin": "Toronto, ON",
  "destination": "Calgary, AB",
  "pickup_date": "2026-06-01",
  "delivery_date": "2026-06-03",
  "commodity": "Auto parts",
  "weight": 42000,
  "rate": 2500,
  "broker_name": "Echo Global Logistics",
  "broker_mc": "MC-123456",
  "broker_contact": "John Broker — 416-555-0199"
}
```

Must respond within **15 seconds**. If AI processing will take longer, return `202` immediately and
provide a polling endpoint.

---

### 5.3 — Manual Load Documents

Attach paperwork to a self-entered load:

```
POST /api/driver-mobile/my-loads/{loadId}/documents
Content-Type: multipart/form-data
Body:
  - file: <image or pdf>
  - document_type: "load_paperwork" | "bol" | "rate_confirmation" | "delivery_proof" | "other"

→ HTTP 200 { "id": "uuid", "url": "...", "document_type": "load_paperwork" }
```

---

## 6. Chat / Messages

### 6.1 — Fetch Messages

```
GET /api/driver-mobile/loads/{loadId}/messages
Authorization: Bearer <jwt>

Response 200: [ ...message objects... ]   ← always an array, never 404 when empty
Response 404: only when the load itself does not exist
```

The frontend polls this endpoint every 10 seconds (backing off exponentially to 60 seconds after
errors, stopping after 5 consecutive failures). Must respond within **5 seconds**.

---

### 6.2 — Send Message

```
POST /api/driver-mobile/loads/{loadId}/messages
Body: { "content": "Message text" }

Response 201:
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

The response must wrap the message inside a `data` key.

---

## 7. Document Vault

The Document Vault stores a driver's personal and business documents with expiry tracking.

### 7.1 — Vault CRUD

```
GET    /api/driver-mobile/vault/documents
→ HTTP 200 [ ...document objects... ]

POST   /api/driver-mobile/vault/documents
Content-Type: multipart/form-data
Body:
  - file: <image or PDF>
  - doc_type: see table below
  - label: "My CDL"
  - expiry_date: "2027-01-15"   (optional)
  - notes: "..."                (optional)
→ HTTP 201 { ...document object... }

DELETE /api/driver-mobile/vault/documents/{docId}
→ HTTP 200 { "status": "deleted" }
```

**Document type values (`doc_type`):**

| Value | Folder | Has Expiry |
|---|---|---|
| `bol` | bol | No |
| `rate_confirmation` | rate_con | No |
| `expense_receipt` | expenses | No |
| `drivers_license` | safety | Yes |
| `medical_card` | safety | Yes |
| `hazmat_cert` | safety | Yes |
| `twic_card` | safety | Yes |
| `abstract` | safety | No |
| `cvor_certificate` | safety | Yes |
| `cargo_insurance` | safety | Yes |
| `liability_insurance` | safety | Yes |
| `operating_authority` | safety | No |
| `void_cheque` | business | No |
| `sin_card` | business | No |
| `vehicle_registration` | business | Yes |
| `lease_agreement` | business | No |
| `ifta_license` | business | Yes |
| `business_registration` | business | No |
| `gst_hst_registration` | business | No |
| `other` | other | No |

**Document object shape:**
```json
{
  "id": "uuid",
  "doc_type": "drivers_license",
  "label": "My CDL",
  "expiry_date": "2027-01-15",
  "notes": "",
  "url": "https://storage.example.com/...",
  "created_at": "2026-05-30T19:00:00Z"
}
```

---

### 7.2 — Invoice Vault (virtual folder)

The "Invoices" folder in the vault is virtual — it fetches from the invoice generator history, not
from `vault/documents`. Ensure this endpoint exists:

```
GET /api/driver-mobile/invoices
→ HTTP 200 [ ...invoice objects... ]
```

---

## 8. Universal Document Scanner (AI — NEW)

The "SMART SCAN" camera button in the bottom nav lets drivers scan any document on the fly. The
backend must identify the document type using DeepSeek AI and return structured extracted data.

### 8.1 — Identify Document (NEW ENDPOINT)

```
POST /api/driver-mobile/scan/identify
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
Body: file: <image or PDF>

Response 200:
{
  "document_type": "expense_receipt",
  "label": "Pilot Flying J — Diesel Fuel",
  "confidence": 0.95,
  "extracted": {
    "amount": 145.50,
    "vendor": "Pilot Flying J",
    "date": "2026-05-30",
    "category": "fuel",
    "description": "Diesel fill-up",
    "expiry_date": null,
    "origin": null,
    "destination": null,
    "rate": null,
    "shipper": null,
    "consignee": null
  }
}
```

**`document_type` must be one of:** `expense_receipt`, `rate_confirmation`, `bol`,
`drivers_license`, `medical_card`, `hazmat_cert`, `twic_card`, `cargo_insurance`,
`liability_insurance`, `vehicle_registration`, `ifta_license`, `other`

**`extracted` fields by document type:**

| Document type | Key fields to extract |
|---|---|
| `expense_receipt` | `amount`, `vendor`, `date`, `category` (`fuel`/`tolls`/`maintenance`/`lumper`/`detention`/`meals`/`lodging`/`scales`/`permits`/`insurance`/`other`) |
| `rate_confirmation` | `origin`, `destination`, `rate`, `pickup_date`, `delivery_date`, `shipper`, `consignee`, `broker_name` |
| `bol` | `shipper`, `consignee`, `origin`, `destination`, `commodity`, `weight` |
| `drivers_license` | `expiry_date` |
| `medical_card` | `expiry_date` |
| Any with expiry | `expiry_date` |

**Prompt guidance for DeepSeek:**
> "You are a document classification and extraction assistant for a trucking company. Examine this
> document image and: 1) Identify the document type from this list: expense_receipt, rate_confirmation,
> bill_of_lading, drivers_license, medical_card, vehicle_registration, insurance_certificate, other.
> 2) Extract all relevant fields (amounts, dates, names, addresses). 3) Respond in JSON only."

**Performance:** Must respond within **15 seconds**. If DeepSeek processing is slow, return
`202 Accepted` with a `job_id` and add a polling endpoint:
```
GET /api/driver-mobile/scan/result/{jobId}
→ 200 { ...same shape as above... } when done
→ 202 { "status": "processing" } while pending
```

---

### 8.2 — Expense Receipt Parsing (existing endpoint)

Used by `ExpenseRecorderScreen` when the driver scans a receipt manually:

```
POST /api/driver-mobile/receipt/parse
Content-Type: multipart/form-data
Body: file: <image>

Response 200:
{
  "amount": 145.50,
  "vendor": "Pilot Flying J",
  "date": "2026-05-30",
  "category": "fuel",
  "description": "Diesel fill-up"
}
```

---

## 9. Profile & Documents (Driver Profile Scan Flow)

### 9.1 — Profile Document Upload

Used during the first-login document scan onboarding flow:

```
POST /api/driver-mobile/documents/scan
Content-Type: multipart/form-data
Body:
  - file: <image>
  - document_type: "drivers_license" | "medical_card" | etc.

Response 200:
{
  "document": { "id": "...", "document_type": "drivers_license", "url": "..." },
  "user": { ...full user object... }
}
```

Error responses must use the same descriptive format as Section 4.4.

---

### 9.2 — User Object — Required Fields

Every endpoint that returns a user object must include **all** of these fields:

```json
{
  "id": "uuid",
  "full_name": "John Smith",
  "email": "john@example.com",
  "phone": "+14165550123",
  "user_type": "driver",
  "phone_verified": true,
  "first_login": false,
  "profile_complete": true,
  "required_documents": ["drivers_license", "medical_card"],
  "logo_url": null,
  "trial_ends_at": "2026-06-13T00:00:00Z",
  "subscription_status": "trial"
}
```

`phone_verified` is especially important — if absent the frontend treats it as `true` by default,
which skips phone verification for unverified accounts.

---

## 10. Error Response Format — Global Standard

The frontend `api()` helper reads `error.detail` from every non-2xx response. If a different key is
used (`message`, `error`, `msg`) the driver sees a generic "Request failed" string.

**All error responses:**
```json
HTTP 4xx / 5xx
{ "detail": "Human-readable message shown directly to the driver." }
```

**Validation errors (FastAPI default — also acceptable):**
```json
HTTP 422
{
  "detail": [
    { "loc": ["body", "phone"], "msg": "Phone number is required.", "type": "value_error" }
  ]
}
```
The frontend joins array items with ". " and displays as a single string.

---

## 11. API Response Time Budget

The frontend uses `AbortController` timeouts on every request.

| Endpoint type | Timeout |
|---|---|
| `POST /location/ping` | **8 seconds** |
| `POST /scan/identify` (AI) | **15 seconds** |
| `POST /rate-con/parse` (AI) | **15 seconds** |
| `POST /receipt/parse` (AI) | **15 seconds** |
| All other endpoints | **15 seconds** |
| File uploads | **15 seconds** — compress server-side if needed |

For any AI call that may exceed 15 seconds: return `202 Accepted` immediately with a `job_id` and
add a polling endpoint. Do not hold the connection open.

---

## 12. Release Checklist

### Must-Have — Blocking Android Release

- [ ] `401` returned consistently for all expired/invalid token scenarios (Section 1.1)
- [ ] `POST /device-token` endpoint live and idempotent (Section 1.3)
- [ ] Password policy enforced server-side on signup and reset (Section 1.4)
- [ ] `POST /location/ping` responds within 8 seconds, accepts `null` load_id (Section 3.1)
- [ ] `GET /loads/{id}/messages` returns `[]` not `404` when no messages (Section 6.1)
- [ ] `POST /loads/{id}/messages` wraps response in `{ "data": {...} }` (Section 6.2)
- [ ] Document upload endpoints return descriptive `detail` error messages (Section 4.4)
- [ ] OTP resend rate limiting (60 seconds) enforced server-side with `429` + `Retry-After` (Section 2.1)
- [ ] `user.phone_verified` field present in all user object responses (Section 9.2)

### Should-Have — High Priority

- [ ] Load status strings match table in Section 4.1 exactly (lowercase, snake_case)
- [ ] All error responses use `{ "detail": "..." }` format (Section 10)
- [ ] Load accept/reject endpoints functional (Section 4.2)
- [ ] `POST /scan/identify` live — enables Smart Scan camera button (Section 8.1)
- [ ] `POST /my-loads/{id}/documents` live — enables Attach Paperwork button (Section 5.3)
- [ ] `user_type` returned correctly (`owner_operator` routes to Business Suite shell)

### Nice-to-Have — Can Ship Without

- [ ] `pickup_lat`, `pickup_lng`, `delivery_lat`, `delivery_lng` on load object for accurate maps (Section 4.1)
- [ ] Expired licence check on load accept — `403` with clear message (Section 4.2)
- [ ] ETag / `If-None-Match` on `GET /loads/{id}/messages` for polling bandwidth savings (Section 6.1)
- [ ] `retry_after_seconds` field in `429` OTP rate-limit response (Section 2.1)
- [ ] `202` + polling for AI endpoints that may exceed 15 seconds (Section 11)

---

## 13. Endpoint Index

| Method | Endpoint | Section |
|---|---|---|
| POST | `/signup` | 1.2 |
| POST | `/signup/open` | 1.2 |
| GET | `/signup/validate-invite` | 1.5 |
| POST | `/reset-password` | 1.4 |
| POST | `/device-token` | 1.3 |
| POST | `/auth/phone/request-otp` | 2.1 |
| POST | `/auth/phone/verify-otp` | 2.2 |
| POST | `/location/ping` | 3.1 |
| GET | `/loads` | 4.1 |
| POST | `/loads/{id}/accept` | 4.2 |
| POST | `/loads/{id}/reject` | 4.2 |
| PATCH | `/loads/{id}/status` | 4.3 |
| GET | `/loads/{id}/documents` | 4.4 |
| POST | `/loads/{id}/documents` | 4.4 |
| GET | `/loads/{id}/messages` | 6.1 |
| POST | `/loads/{id}/messages` | 6.2 |
| GET | `/my-loads` | 5.1 |
| POST | `/my-loads` | 5.1 |
| PATCH | `/my-loads/{id}` | 5.1 |
| DELETE | `/my-loads/{id}` | 5.1 |
| POST | `/my-loads/{id}/documents` | 5.3 |
| POST | `/rate-con/parse` | 5.2 |
| GET | `/vault/documents` | 7.1 |
| POST | `/vault/documents` | 7.1 |
| DELETE | `/vault/documents/{id}` | 7.1 |
| GET | `/invoices` | 7.2 |
| POST | `/scan/identify` | 8.1 |
| GET | `/scan/result/{jobId}` | 8.1 |
| POST | `/receipt/parse` | 8.2 |
| POST | `/documents/scan` | 9.1 |
| GET | `/ai/history` | — |
| POST | `/ai/chat` | — |

---

*Updated: May 30, 2026*
*Frontend repo: Driver-PWA---Web-APP, branch: staging*
*Contact: refer to GitHub commits on this branch for exact request/response shapes used in code*
