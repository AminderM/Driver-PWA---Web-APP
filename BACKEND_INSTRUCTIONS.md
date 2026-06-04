# Backend Developer Instructions
## Integra Driver PWA — Full API Specification

---

## ⚠️ CRITICAL BUGS IN PRODUCTION (Fix First — June 2026)

The following backend issues are causing visible failures in the live staging app.
Fix these before anything else.

### BUG 1 — `paid_amount` not persisting on `PATCH /my-loads/{id}` [CRITICAL]

**Symptom:** Driver records a payment → it shows immediately → switch tabs or refresh →
payment resets to $0. The P&L "COLLECTED" card always shows $0.

**Root cause:** `PATCH /my-loads/{id}` does not save `paid_amount` to the database,
or `GET /my-loads` does not return the saved `paid_amount` in the response.

**Required fix:**
```
PATCH /api/driver-mobile/my-loads/{id}
Body: { "paid_amount": 2500 }
→ Must persist to DB and return the updated load with paid_amount in GET /my-loads
```

The frontend sends `{ paid_amount: <number> }` and expects every subsequent
`GET /my-loads` response to include that `paid_amount` value on the load object.
As a temporary workaround the frontend caches payments in localStorage, but the
backend MUST persist this — localStorage is not reliable across devices/reinstalls.

---

### BUG 2 — `status` field returned with wrong casing [CRITICAL]

**Symptom:** P&L shows 0 loads, 0 collected, 0 invoiced — even when loads exist.

**Root cause:** Backend returns `"Invoiced"` or `"Delivered"` (capital first letter)
but the frontend filter compares against lowercase `"invoiced"` / `"delivered"`.

**Required fix:** All `status` values in API responses must be **lowercase**:
```json
{ "status": "invoiced" }   ✅
{ "status": "Invoiced" }   ❌  breaks P&L, load filters, and Record Payment button
```

Affected statuses: `upcoming`, `in_transit`, `delivered`, `invoiced`

---

### BUG 3 — `PATCH /profile` endpoint missing or not saving `company_name` / `mc_dot_number` [HIGH]

**Symptom:** Driver enters company name and MC/DOT on profile page, taps Save —
data disappears after the app restarts (only survives the current session via localStorage).

**Required fix:**
```
PATCH /api/driver-mobile/profile
Content-Type: application/json
Body: { "company_name": "Smith Trucking Inc.", "mc_dot_number": "MC-123456" }
→ Must persist to DB
→ Response must be one of:
   { "user": { ...full user object... } }   ← preferred
   { "company_name": "Smith Trucking Inc.", "mc_dot_number": "MC-123456" }
```

The frontend calls this immediately when the driver saves Business Info. If it returns
a non-200, the UI shows an error. If `company_name` is not in the response, the
invoice generator will show "Your Company Name" instead of the real company.

---

### BUG 4 — `POST /scan/identify` endpoint not implemented [HIGH]

**Symptom:** Tapping the camera (SCAN) button and uploading any document shows a spinner
then "Could not identify document" error.

**Required fix:** Implement `POST /api/driver-mobile/scan/identify`
See **Section 8.1** below for the full spec. This is a DeepSeek AI endpoint.

The frontend sends the file as `multipart/form-data` with field name `file`.
The AI must identify the document type and extract relevant fields.
Return shape:
```json
{
  "document_type": "expense_receipt",
  "label": "Shell Gas Station",
  "confidence": 0.95,
  "extracted": {
    "amount": 124.50,
    "vendor": "Shell",
    "date": "2026-05-31",
    "category": "fuel"
  }
}
```

For `rate_confirmation`, the frontend will automatically call `POST /my-loads` to
create a load using `extracted.origin`, `extracted.destination`, `extracted.rate`, etc.

---

### BUG 5 — `GET /profile` not returning `company_name` / `mc_dot_number` on login [MEDIUM]

**Symptom:** After logging out and back in, `company_name` and `mc_dot_number` are blank
even though they were saved.

**Required fix:** The login response at `POST /signup` or `POST /auth/...` must include:
```json
{
  "user": {
    "company_name": "Smith Trucking Inc.",
    "mc_dot_number": "MC-123456",
    ...
  }
}
```

---

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

## 14. DeepSeek AI — Document Scanning Configuration

**Updated: June 4, 2026 — DeepSeek API key has been generated and must be wired to all three scan endpoints below.**

---

### 14.0 — Environment Setup

Add the following environment variable to your staging and production server:

```
DEEPSEEK_API_KEY=<your_key_here>
```

All three scan endpoints (`/rate-con/parse`, `/receipt/parse`, `/scan/identify`) must read this
variable. Never hard-code the key.

**DeepSeek API details:**

| Parameter | Value |
|---|---|
| Base URL | `https://api.deepseek.com/v1` |
| Vision model | `deepseek-chat` (supports image input) |
| Auth header | `Authorization: Bearer $DEEPSEEK_API_KEY` |
| Content-Type | `application/json` |
| Max response time | 15 seconds (return `202` + poll if slower — see Section 11) |

**How to send an image to DeepSeek** (OpenAI-compatible format):

```python
import anthropic, base64, httpx

def call_deepseek_vision(image_bytes: bytes, mime_type: str, prompt: str) -> str:
    b64 = base64.b64encode(image_bytes).decode()
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{b64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 1024,
        "temperature": 0
    }
    resp = httpx.post(
        "https://api.deepseek.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}"},
        json=payload,
        timeout=14
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]
```

For **PDF files**, convert the first page to a JPEG image (using `pdf2image` or `pypdfium2`)
before sending to DeepSeek. DeepSeek vision does not accept raw PDF bytes.

```python
from pdf2image import convert_from_bytes
def pdf_to_image_bytes(pdf_bytes: bytes) -> tuple[bytes, str]:
    images = convert_from_bytes(pdf_bytes, dpi=200, first_page=1, last_page=1)
    buf = io.BytesIO()
    images[0].save(buf, format="JPEG", quality=85)
    return buf.getvalue(), "image/jpeg"
```

---

### 14.1 — Rate Confirmation Scanner

**Endpoint:** `POST /api/driver-mobile/rate-con/parse`
**Frontend trigger:** My Loads → Add Load → Scan Rate Confirmation

**System prompt to send to DeepSeek:**

```
You are an expert at reading trucking rate confirmations and load tenders.
Analyze this document and extract the following fields exactly.

Return ONLY a valid JSON object with these keys (use null for any field not found):
{
  "shipper":        string | null,   // shipper / pickup company name
  "consignee":      string | null,   // consignee / delivery company name
  "origin":         string | null,   // pickup city and state/province (e.g. "Toronto, ON")
  "destination":    string | null,   // delivery city and state/province
  "pickup_date":    string | null,   // ISO format YYYY-MM-DD
  "delivery_date":  string | null,   // ISO format YYYY-MM-DD
  "commodity":      string | null,   // freight description
  "weight":         number | null,   // weight in lbs as a number only
  "rate":           number | null,   // total load rate as a number only (no $ symbol)
  "broker_name":    string | null,   // brokerage company name
  "broker_mc":      string | null,   // broker MC or DOT number
  "broker_contact": string | null    // broker contact name, phone, or email
}

Rules:
- Return ONLY the JSON object. No explanation, no markdown, no code fences.
- Dates must be YYYY-MM-DD. If only month/day given, infer the year from context.
- Weight and rate must be numbers only (strip "$", "lbs", ",").
- If a field appears multiple times, prefer the most prominent value.
```

**Success response (HTTP 200):**
```json
{
  "shipper": "Magna International",
  "consignee": "Toyota Assembly Plant",
  "origin": "Toronto, ON",
  "destination": "Calgary, AB",
  "pickup_date": "2026-06-10",
  "delivery_date": "2026-06-12",
  "commodity": "Auto parts",
  "weight": 42000,
  "rate": 2500,
  "broker_name": "Echo Global Logistics",
  "broker_mc": "MC-123456",
  "broker_contact": "John Broker — 416-555-0199"
}
```

**Error response (HTTP 422):**
```json
{ "detail": "Could not extract data from this document. Please check the image quality and try again." }
```

---

### 14.2 — Expense Receipt Scanner

**Endpoint:** `POST /api/driver-mobile/receipt/parse`
**Frontend trigger:** Expenses → Scan Receipt

**System prompt to send to DeepSeek:**

```
You are an expert at reading expense receipts for truck drivers.
Analyze this receipt image and extract the following fields.

Return ONLY a valid JSON object with these keys (use null for any field not found):
{
  "amount":      number | null,   // total amount paid as a number only (no $ symbol)
  "vendor":      string | null,   // business/store name
  "date":        string | null,   // receipt date in YYYY-MM-DD format
  "category":    string | null,   // MUST be one of: fuel, tolls, maintenance, lumper,
                                  // detention, meals, lodging, scales, permits, insurance, other
  "description": string | null    // brief description of what was purchased
}

Category selection rules:
- "fuel"        → gas stations, diesel, DEF fluid
- "tolls"       → highway tolls, bridge tolls, e-ZPass
- "maintenance" → truck repairs, oil changes, tires, parts
- "lumper"      → loading/unloading labor fees
- "detention"   → detention fees charged to broker
- "meals"       → restaurants, fast food, truck stop food
- "lodging"     → hotels, motels, rest stop fees
- "scales"      → weigh station fees
- "permits"     → oversize/overweight permits
- "insurance"   → any insurance premium payments
- "other"       → anything that does not fit above

Rules:
- Return ONLY the JSON object. No explanation, no markdown, no code fences.
- Amount must be a number (strip "$", ",").
- Date must be YYYY-MM-DD. If the year is missing, use the current year.
```

**Success response (HTTP 200):**
```json
{
  "amount": 145.50,
  "vendor": "Pilot Flying J",
  "date": "2026-06-04",
  "category": "fuel",
  "description": "Diesel fill-up — 85 gallons"
}
```

---

### 14.3 — Universal Smart Scan (Document Identifier)

**Endpoint:** `POST /api/driver-mobile/scan/identify`
**Frontend trigger:** Smart Scan button (camera icon in nav bar)

This endpoint does TWO things in one call:
1. **Identifies** the document type
2. **Extracts** all relevant fields including expiry dates

**System prompt to send to DeepSeek:**

```
You are an expert document classification and data extraction assistant for truck drivers.
Analyze this document image and perform two tasks:

TASK 1 — Classify the document type. Choose EXACTLY ONE from this list:
  expense_receipt, rate_confirmation, bol, drivers_license, medical_card,
  hazmat_cert, twic_card, cargo_insurance, liability_insurance,
  vehicle_registration, ifta_license, cvor_certificate, abstract,
  lease_agreement, business_registration, void_cheque, other

TASK 2 — Extract all relevant fields based on the document type.

Return ONLY a valid JSON object in this exact shape:
{
  "document_type": string,       // one of the types listed above
  "label":         string,       // short human-readable label, e.g. "CDL Class A — John Smith"
  "confidence":    number,       // 0.0 to 1.0, how confident you are in the classification
  "extracted": {
    "expiry_date":    string | null,   // YYYY-MM-DD — critical for licence/insurance/registration
    "amount":         number | null,   // for expense_receipt
    "vendor":         string | null,   // for expense_receipt
    "date":           string | null,   // document date or receipt date, YYYY-MM-DD
    "category":       string | null,   // for expense_receipt: fuel/tolls/maintenance/lumper/detention/meals/lodging/scales/permits/insurance/other
    "description":    string | null,   // brief description
    "origin":         string | null,   // for rate_confirmation / bol
    "destination":    string | null,   // for rate_confirmation / bol
    "rate":           number | null,   // for rate_confirmation
    "pickup_date":    string | null,   // for rate_confirmation, YYYY-MM-DD
    "delivery_date":  string | null,   // for rate_confirmation, YYYY-MM-DD
    "shipper":        string | null,
    "consignee":      string | null,
    "broker_name":    string | null,
    "commodity":      string | null,
    "weight":         number | null,
    "holder_name":    string | null    // name on licence/card
  }
}

Critical rules:
- Return ONLY the JSON object. No explanation, no markdown, no code fences.
- expiry_date is the MOST IMPORTANT field — look for "EXP", "EXPIRES", "EXPIRY DATE",
  "VALID UNTIL", "RENEWAL DATE" on every document. Always return YYYY-MM-DD.
- For drivers_license: expiry_date is typically on the front of the card.
- For medical_card: expiry_date is the certification expiry, not the exam date.
- For insurance certificates: expiry_date is the policy end date.
- For vehicle_registration: expiry_date is the renewal/sticker date.
- All dates must be YYYY-MM-DD. Never return ambiguous formats like "05/06/27".
- Confidence below 0.6 should return document_type as "other".
```

**Success response (HTTP 200):**
```json
{
  "document_type": "drivers_license",
  "label": "Driver's Licence — John Smith",
  "confidence": 0.97,
  "extracted": {
    "expiry_date": "2028-03-14",
    "holder_name": "John Smith",
    "date": null,
    "amount": null,
    "vendor": null,
    "category": null,
    "description": null,
    "origin": null,
    "destination": null,
    "rate": null,
    "pickup_date": null,
    "delivery_date": null,
    "shipper": null,
    "consignee": null,
    "broker_name": null,
    "commodity": null,
    "weight": null
  }
}
```

**Post-scan server logic:**

After a successful scan, if `extracted.expiry_date` is non-null:
1. Automatically save the document to the vault (`vault/documents`) with the extracted fields
2. Schedule expiry reminder notifications (Section 14.4)
3. Return the `scan/identify` response as-is — the frontend will handle vault display

If `document_type` is `rate_confirmation`, the frontend will call `POST /my-loads` automatically
using the extracted fields. The backend does NOT need to create the load from this endpoint.

---

### 14.4 — Document Expiry Notification System

All documents with an `expiry_date` — whether uploaded through Smart Scan, the Document Vault,
or the first-login scan flow — must trigger the following scheduled push notifications.

**Notification schedule (relative to `expiry_date`):**

| Days before expiry | Notification title | Body |
|---|---|---|
| 60 days | "Document Expiring Soon" | "Your [document label] expires in 60 days. Start your renewal process." |
| 30 days | "Document Expiring Soon" | "Your [document label] expires in 30 days. Schedule your renewal now." |
| 15 days | "⚠️ Action Required" | "Your [document label] expires in 15 days. Renew immediately to avoid disruption." |
| 7 days | "⚠️ Urgent: Document Expiring" | "Your [document label] expires in 7 days. You may be unable to accept loads after expiry." |
| 1 day | "🚨 Expires Tomorrow" | "Your [document label] expires TOMORROW. Renew today or you risk being taken off the road." |
| Expiry day + overdue | "🚨 Document EXPIRED" | "Your [document label] has expired. Renew immediately — you cannot legally operate with an expired [document type]." |

**Overdue repeat schedule:**
Send the "EXPIRED" notification again at: +7 days, +14 days, +30 days after expiry date —
until the document is replaced or deleted from the vault.

**Implementation requirements:**

```
1. Database: Add a `notification_jobs` table (or use your existing job queue):
   - document_id (FK → vault_documents)
   - driver_id   (FK → users)
   - scheduled_for (datetime, UTC)
   - type (enum: expiry_60d | expiry_30d | expiry_15d | expiry_7d | expiry_1d | expired | overdue_7d | overdue_14d | overdue_30d)
   - sent (boolean, default false)
   - created_at

2. On every document upsert (create OR update expiry_date):
   - Delete all pending (unsent) notification_jobs for this document_id
   - If expiry_date is non-null, insert new jobs for all thresholds that are still in the future

3. Cron job — runs daily at 08:00 driver local time (or 12:00 UTC as fallback):
   SELECT * FROM notification_jobs
   WHERE sent = false AND scheduled_for <= NOW()

   For each job:
   a. Look up driver push tokens (from device_tokens table, Section 1.3)
   b. Send push notification via FCM (Android) and/or APNs (iOS)
   c. Mark job as sent = true

4. Push notification payload:

   FCM (Android):
   {
     "to": "<fcm_token>",
     "notification": {
       "title": "<title from table above>",
       "body":  "<body from table above>"
     },
     "data": {
       "type": "document_expiry",
       "document_id": "<uuid>",
       "document_type": "<doc_type>",
       "expiry_date": "<YYYY-MM-DD>",
       "screen": "vault"
     },
     "android": {
       "priority": "high",
       "notification": { "channel_id": "document_alerts" }
     }
   }

   APNs (iOS):
   {
     "aps": {
       "alert": { "title": "<title>", "body": "<body>" },
       "sound": "default",
       "badge": 1,
       "content-available": 1
     },
     "type": "document_expiry",
     "document_id": "<uuid>",
     "screen": "vault"
   }

5. Deep-link: When the driver taps the notification, the app should open to the
   Document Vault → specific folder containing the expiring document.
   The "screen": "vault" data field signals this to the frontend.

6. Do NOT send notifications for documents that have been deleted.
   Delete all pending jobs when a document is deleted.

7. Respect user notification preferences — add a
   PUT /api/driver-mobile/notification-preferences endpoint:
   {
     "document_expiry": true | false   // default true
   }
```

**Document type → human-readable label mapping for notifications:**

| `doc_type` | Label in notification |
|---|---|
| `drivers_license` | Driver's Licence |
| `medical_card` | Medical Card |
| `hazmat_cert` | HazMat Certification |
| `twic_card` | TWIC Card |
| `cargo_insurance` | Cargo Insurance |
| `liability_insurance` | Liability Insurance |
| `vehicle_registration` | Vehicle Registration |
| `ifta_license` | IFTA Licence |
| `cvor_certificate` | CVOR/NSC Certificate |

---

### 14.5 — Error Handling for All Scan Endpoints

All three scan endpoints must handle these failure cases:

| Scenario | HTTP | Response body |
|---|---|---|
| DeepSeek API key missing / invalid | 503 | `{ "detail": "AI service is not configured. Contact support." }` |
| DeepSeek API rate limit / quota exceeded | 503 | `{ "detail": "AI service is temporarily unavailable. Please try again in a moment." }` |
| File too large (> 10 MB) | 413 | `{ "detail": "File is too large. Maximum 10 MB." }` |
| Unsupported file type | 415 | `{ "detail": "Unsupported file type. Please upload a JPEG, PNG, or PDF." }` |
| Image too blurry / unreadable (confidence < 0.4) | 422 | `{ "detail": "Could not read this document clearly. Please retake the photo with better lighting and focus." }` |
| DeepSeek returns invalid JSON | 422 | `{ "detail": "AI could not extract data from this document. Please try again or enter details manually." }` |
| DeepSeek timeout > 14s | 202 | Return job_id for polling (Section 11) |

---

### 14.6 — Testing the DeepSeek Integration

Use these test cases to verify the integration before release:

```bash
# 1. Rate con parse — should return all fields
curl -X POST https://api.staging.integratedtech.ca/api/driver-mobile/rate-con/parse \
  -H "Authorization: Bearer <test_jwt>" \
  -F "file=@test_rate_con.jpg"

# 2. Receipt parse — should return category: "fuel"
curl -X POST https://api.staging.integratedtech.ca/api/driver-mobile/receipt/parse \
  -H "Authorization: Bearer <test_jwt>" \
  -F "file=@test_gas_receipt.jpg"

# 3. Smart scan — drivers licence should return expiry_date
curl -X POST https://api.staging.integratedtech.ca/api/driver-mobile/scan/identify \
  -H "Authorization: Bearer <test_jwt>" \
  -F "file=@test_drivers_licence.jpg"
# Expected: document_type = "drivers_license", extracted.expiry_date = "YYYY-MM-DD"

# 4. Smart scan — insurance cert should return expiry_date
curl -X POST https://api.staging.integratedtech.ca/api/driver-mobile/scan/identify \
  -H "Authorization: Bearer <test_jwt>" \
  -F "file=@test_insurance.pdf"
# Expected: document_type = "cargo_insurance" or "liability_insurance", extracted.expiry_date non-null
```

All three endpoints must be live and tested on **staging** before the next production release.

---

## 13. Endpoint Index *(updated)*

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
| POST | `/rate-con/parse` *(DeepSeek)* | 14.1 |
| GET | `/vault/documents` | 7.1 |
| POST | `/vault/documents` | 7.1 |
| DELETE | `/vault/documents/{id}` | 7.1 |
| GET | `/invoices` | 7.2 |
| POST | `/scan/identify` *(DeepSeek)* | 14.3 |
| GET | `/scan/result/{jobId}` | 11 |
| POST | `/receipt/parse` *(DeepSeek)* | 14.2 |
| POST | `/documents/scan` | 9.1 |
| PUT | `/notification-preferences` | 14.4 |
| GET | `/ai/history` | — |
| POST | `/ai/chat` | — |

---

*Updated: June 4, 2026*
*Frontend repo: Driver-PWA---Web-APP, branch: staging*
*Contact: refer to GitHub commits on this branch for exact request/response shapes used in code*
