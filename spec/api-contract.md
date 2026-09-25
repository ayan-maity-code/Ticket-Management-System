# Support Ticket Management System — REST API Contract

This document defines the **REST API contract only**. Behavior and data must align with:

- [`spec/requirements.md`](requirements.md)
- [`spec/architecture.md`](architecture.md)
- [`spec/data-model.md`](data-model.md)
- [`spec/state-machine.md`](state-machine.md)

Status transition **rules** are defined only in `spec/state-machine.md`; this contract references them but does not duplicate the transition matrix.

---

## 1. API Conventions

### 1.1 Base path

| Item | Value |
|------|--------|
| **Base API path** | `/api/v1` |

*API design decision:* Version prefix `v1` allows future contract changes without breaking clients.

All paths below are relative to this base (e.g. full path for tickets collection: `/api/v1/tickets`).

### 1.2 Format

| Item | Convention |
|------|------------|
| **Request/response body** | JSON |
| **Content-Type** | `application/json` for requests with a body and for JSON responses |
| **Character encoding** | UTF-8 |

### 1.3 HTTP methods

| Method | Usage in this API |
|--------|-------------------|
| `GET` | Retrieve ticket(s) or ticket details |
| `POST` | Create ticket; add comment |
| `PATCH` | Update ticket fields; change ticket status |

*API design decision:* `PUT` is not used. Field updates and status changes use separate `PATCH` operations.

### 1.4 Identifiers

| Item | Convention |
|------|------------|
| **Ticket and comment `id`** | String; UUID format recommended (e.g. `550e8400-e29b-41d4-a716-446655440000`) |

*API design decision:* UUID strings match common Spring/JSON practice. Requirements do not mandate a format; opaque string identifiers are sufficient.

Path parameters use the name `ticketId` for ticket resources and `commentId` where needed.

### 1.5 General response conventions

- **Success:** JSON body matches the response DTO for the operation unless the operation returns no content (none of the required operations use 204 in this contract).
- **Error:** JSON body uses the **Error Response** structure (Section 5.4, Section 7).
- **Field naming:** JSON properties use **camelCase** (e.g. `ticketId`, `assignee`).
- **Status values:** Uppercase strings exactly as in the state machine: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED`.
- **Timestamps:** Not required by the data model; ticket and comment responses in this contract **do not** include `createdAt` / `updatedAt` unless a future spec adds them.

### 1.6 Requirements vs design decisions

| Topic | Source |
|-------|--------|
| Create, list, detail, update fields, comments, search, filter, validation, status rules | Requirements + state machine |
| Paths, HTTP method choices, UUIDs, error codes, list wrapper shape, combined query params | **API design decisions** in this document |

---

## 2. Ticket APIs

### 2.1 Create a ticket

| | |
|--|--|
| **Method** | `POST` |
| **Path** | `/tickets` |
| **Purpose** | Create a new ticket (FR-1). Initial status is **`OPEN`** on the server ([`spec/state-machine.md`](state-machine.md) §3); clients must not set status on create. |

**Request body:** `CreateTicketRequest` (Section 4.1)

**Response:** `201 Created` — `TicketResponse` (Section 5.1)

**Status codes:** `201`, `400`, `500`

---

### 2.2 List tickets

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/tickets` |
| **Purpose** | Return tickets (FR-2). Supports optional **keyword search** and **status filter** via query parameters (Section 8). With no query parameters, returns all tickets (subject to implementation limits). |

**Query parameters:** See Section 8 (`keyword`, `status`).

**Response:** `200 OK` — `TicketListResponse` (Section 5.2)

**Status codes:** `200`, `400` (invalid `status` query value), `500`

---

### 2.3 Get ticket details

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/tickets/{ticketId}` |
| **Purpose** | View one ticket and its comments (FR-3, FR-5 display). |

**Path parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticketId` | string | Yes | Ticket identifier |

**Response:** `200 OK` — `TicketDetailResponse` (Section 5.1)

**Status codes:** `200`, `404`, `500`

---

### 2.4 Update ticket fields

| | |
|--|--|
| **Method** | `PATCH` |
| **Path** | `/tickets/{ticketId}` |
| **Purpose** | Update **title**, **description**, **priority**, and/or **assignee** (FR-4, TR-4–TR-7). Does **not** change **status**; use Section 2.5. |

**Path parameters:** `ticketId` (required)

**Request body:** `UpdateTicketRequest` (Section 4.2)

**Response:** `200 OK` — `TicketResponse` (Section 5.1)

**Status codes:** `200`, `400`, `404`, `500`

---

### 2.5 Change ticket status

| | |
|--|--|
| **Method** | `PATCH` |
| **Path** | `/tickets/{ticketId}/status` |
| **Purpose** | Request a **status transition** (SR-1, AC-9). Rules: [`spec/state-machine.md`](state-machine.md). |

**Path parameters:** `ticketId` (required)

**Request body:** `UpdateTicketStatusRequest` (Section 4.3)

**Response:** `200 OK` — `TicketResponse` (Section 5.1)

**Status codes:** `200`, `400`, `404`, `409`, `500`

See Section 9.

---

### 2.6 Search tickets (keyword)

Keyword search is performed via **`GET /tickets`** with the `keyword` query parameter (Section 8). There is no separate search path.

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/tickets?keyword={keyword}` |
| **Purpose** | Search tickets by keyword (FR-6, TR-10). |

**Response / status codes:** Same as **List tickets** (Section 2.2).

---

### 2.7 Filter tickets by status

Status filtering is performed via **`GET /tickets`** with the `status` query parameter (Section 8).

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/tickets?status={status}` |
| **Purpose** | Filter tickets by status (FR-7, TR-11). |

**Response / status codes:** Same as **List tickets** (Section 2.2).

---

## 3. Comment API

### 3.1 Add a comment to a ticket

| | |
|--|--|
| **Method** | `POST` |
| **Path** | `/tickets/{ticketId}/comments` |
| **Purpose** | Add a comment to a ticket (FR-5, TR-8). No edit or delete. |

**Path parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticketId` | string | Yes | Ticket identifier |

**Request body:** `CreateCommentRequest` (Section 4.4)

**Response:** `201 Created` — `CommentResponse` (Section 5.3)

**Status codes:** `201`, `400`, `404`, `500`

*API design decision:* Returns the created comment. The client may refetch ticket details to refresh the full comment list.

---

## 4. Request DTOs

Validation expectations describe contract-level rules; exact annotation names are implementation detail (FR-9, VR-1).

### 4.1 `CreateTicketRequest`

| Field | JSON type | Required | Validation expectations |
|-------|-----------|----------|------------------------|
| `title` | string | Yes | Non-blank after trim |
| `description` | string | Yes | Non-blank after trim |
| `priority` | string | Yes | Non-blank after trim |
| `assignee` | string | No | If present, non-blank after trim |

`status` is **not** accepted; server sets `OPEN`.

### 4.2 `UpdateTicketRequest`

At least one field must be present. Omitted fields are left unchanged.

| Field | JSON type | Required | Validation expectations |
|-------|-----------|----------|------------------------|
| `title` | string | No | If present, non-blank after trim |
| `description` | string | No | If present, non-blank after trim |
| `priority` | string | No | If present, non-blank after trim |
| `assignee` | string | No | If present, may be blank to clear assignee *only if* implementation allows unassigned tickets; otherwise reject blank |

*API design decision:* Allowing `assignee: ""` to clear is optional; backend validation is authoritative.

`status` is **not** accepted on this DTO.

### 4.3 `UpdateTicketStatusRequest`

| Field | JSON type | Required | Validation expectations |
|-------|-----------|----------|------------------------|
| `status` | string | Yes | Must be one of: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED` |

Transition validity is enforced by the backend per [`spec/state-machine.md`](state-machine.md), not by this enum check alone.

### 4.4 `CreateCommentRequest`

| Field | JSON type | Required | Validation expectations |
|-------|-----------|----------|------------------------|
| `body` | string | Yes | Non-blank after trim |

---

## 5. Response DTOs

### 5.1 `TicketResponse`

Used for create, update, and status change responses, and as the ticket portion of detail.

| Field | JSON type | Description |
|-------|-----------|-------------|
| `id` | string | Ticket identifier |
| `title` | string | Title |
| `description` | string | Description |
| `priority` | string | Priority |
| `assignee` | string or `null` | Assignee if set |
| `status` | string | Current status (state machine values) |

### 5.2 `TicketDetailResponse`

| Field | JSON type | Description |
|-------|-----------|-------------|
| `id` | string | Ticket identifier |
| `title` | string | Title |
| `description` | string | Description |
| `priority` | string | Priority |
| `assignee` | string or `null` | Assignee if set |
| `status` | string | Current status |
| `comments` | array of `CommentResponse` | Comments for this ticket (may be empty) |

### 5.3 `TicketListResponse`

| Field | JSON type | Description |
|-------|-----------|-------------|
| `tickets` | array of `TicketResponse` | Matching tickets (may be empty) |

*API design decision:* Wrapper object with `tickets` array (not a bare array) for consistent extensibility.

### 5.4 `CommentResponse`

| Field | JSON type | Description |
|-------|-----------|-------------|
| `id` | string | Comment identifier |
| `ticketId` | string | Parent ticket identifier |
| `body` | string | Comment text |

### 5.5 `ErrorResponse`

See Section 7.

---

## 6. HTTP Status Codes

| Situation | Status code |
|-----------|-------------|
| Successful creation (ticket, comment) | `201 Created` |
| Successful retrieval (list, detail) | `200 OK` |
| Successful update (fields or status) | `200 OK` |
| Validation failure (request body or query) | `400 Bad Request` |
| Ticket not found | `404 Not Found` |
| Invalid status transition | `409 Conflict` |
| Unexpected server error | `500 Internal Server Error` |

*API design decision:* `409 Conflict` for invalid status transition indicates a business/state conflict (SR-2). Requirements do not mandate a specific code.

---

## 7. Error Contract

All error responses use **`ErrorResponse`**:

| Field | JSON type | Required | Description |
|-------|-----------|----------|-------------|
| `message` | string | Yes | Human-readable summary |
| `code` | string | Yes | Machine-readable code (stable for clients) |
| `errors` | array of `FieldError` | No | Present for validation failures |

**`FieldError`:**

| Field | JSON type | Description |
|-------|-----------|-------------|
| `field` | string | JSON property or parameter name (e.g. `title`, `status`, `keyword`) |
| `message` | string | Human-readable message for that field |

### 7.1 Standard error codes

| `code` | Typical HTTP status | When used |
|--------|---------------------|-----------|
| `VALIDATION_ERROR` | `400` | Bean Validation or invalid query parameter |
| `TICKET_NOT_FOUND` | `404` | No ticket for `ticketId` |
| `INVALID_STATUS_TRANSITION` | `409` | Requested status transition not allowed ([`spec/state-machine.md`](state-machine.md)) |
| `INTERNAL_ERROR` | `500` | Unhandled server failure |

*API design decision:* Code strings are part of this contract; messages may vary but should remain meaningful (FR-10).

---

## 8. Search and Filtering

Both apply to **`GET /api/v1/tickets`**.

### 8.1 Keyword search

| Query param | Type | Required | Description |
|-------------|------|----------|-------------|
| `keyword` | string | No | Non-blank keyword to search tickets (FR-6). |

*Requirement context:* Search is against persisted ticket data; which fields are matched is an implementation choice ([`spec/data-model.md`](data-model.md) §7.2).

If `keyword` is present but blank after trim → `400` with `VALIDATION_ERROR`.

### 8.2 Status filter

| Query param | Type | Required | Description |
|-------------|------|----------|-------------|
| `status` | string | No | Exact status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, or `CANCELLED` (FR-7). |

Invalid `status` value → `400` with `VALIDATION_ERROR`.

### 8.3 Combined search and filter

*API design decision:* Parameters may be combined:

```text
GET /api/v1/tickets?keyword=login&status=OPEN
```

Returns tickets that match **both** the keyword search and the status filter.

Omitting both parameters returns all tickets (list behavior).

---

## 9. Status Update

### 9.1 How target status is supplied

Clients send **`PATCH /api/v1/tickets/{ticketId}/status`** with body:

```json
{ "status": "<TARGET_STATUS>" }
```

where `<TARGET_STATUS>` is one of the five state machine statuses.

### 9.2 Backend behavior (contractual)

| Rule | Reference |
|------|-----------|
| Backend validates `(currentStatus, requestedStatus)` against [`spec/state-machine.md`](state-machine.md). | SR-2, AC-10 |
| Only **valid** transitions are accepted; response `200` and body reflects new status. | SR-1, AC-9 |
| **Invalid** transitions → `409`, `code` `INVALID_STATUS_TRANSITION`; **persisted status unchanged**. | State machine §8 |
| Frontend must show `message` (and must not rely on UI-only checks). | FR-10, architecture §6 |

This document does **not** list valid transitions; see the state machine specification.

---

## 10. API Examples

Examples use the structures above. IDs are illustrative.

### 10.1 Creating a ticket

**Request**

```http
POST /api/v1/tickets
Content-Type: application/json
```

```json
{
  "title": "Cannot reset password",
  "description": "User reports reset email never arrives.",
  "priority": "HIGH",
  "assignee": "alice@example.com"
}
```

**Response** `201 Created`

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "title": "Cannot reset password",
  "description": "User reports reset email never arrives.",
  "priority": "HIGH",
  "assignee": "alice@example.com",
  "status": "OPEN"
}
```

---

### 10.2 Listing tickets

**Request**

```http
GET /api/v1/tickets
```

**Response** `200 OK`

```json
{
  "tickets": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "title": "Cannot reset password",
      "description": "User reports reset email never arrives.",
      "priority": "HIGH",
      "assignee": "alice@example.com",
      "status": "OPEN"
    }
  ]
}
```

---

### 10.3 Getting ticket details

**Request**

```http
GET /api/v1/tickets/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

**Response** `200 OK`

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "title": "Cannot reset password",
  "description": "User reports reset email never arrives.",
  "priority": "HIGH",
  "assignee": "alice@example.com",
  "status": "OPEN",
  "comments": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "ticketId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "body": "Checked spam folder; still no email."
    }
  ]
}
```

---

### 10.4 Updating a ticket

**Request**

```http
PATCH /api/v1/tickets/7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json
```

```json
{
  "assignee": "bob@example.com",
  "priority": "MEDIUM"
}
```

**Response** `200 OK`

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "title": "Cannot reset password",
  "description": "User reports reset email never arrives.",
  "priority": "MEDIUM",
  "assignee": "bob@example.com",
  "status": "OPEN"
}
```

---

### 10.5 Changing ticket status

**Request**

```http
PATCH /api/v1/tickets/7c9e6679-7425-40de-944b-e07fc1f90ae7/status
Content-Type: application/json
```

```json
{
  "status": "IN_PROGRESS"
}
```

**Response** `200 OK`

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "title": "Cannot reset password",
  "description": "User reports reset email never arrives.",
  "priority": "MEDIUM",
  "assignee": "bob@example.com",
  "status": "IN_PROGRESS"
}
```

---

### 10.6 Adding a comment

**Request**

```http
POST /api/v1/tickets/7c9e6679-7425-40de-944b-e07fc1f90ae7/comments
Content-Type: application/json
```

```json
{
  "body": "Resent reset link from admin console."
}
```

**Response** `201 Created`

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "ticketId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "body": "Resent reset link from admin console."
}
```

---

### 10.7 Searching tickets

**Request**

```http
GET /api/v1/tickets?keyword=password&status=OPEN
```

**Response** `200 OK`

```json
{
  "tickets": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "title": "Cannot reset password",
      "description": "User reports reset email never arrives.",
      "priority": "MEDIUM",
      "assignee": "bob@example.com",
      "status": "OPEN"
    }
  ]
}
```

---

### 10.8 Validation error

**Request**

```http
POST /api/v1/tickets
Content-Type: application/json
```

```json
{
  "title": "",
  "description": "Missing title",
  "priority": "LOW"
}
```

**Response** `400 Bad Request`

```json
{
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

### 10.9 Invalid status transition

**Request**

```http
PATCH /api/v1/tickets/7c9e6679-7425-40de-944b-e07fc1f90ae7/status
Content-Type: application/json
```

```json
{
  "status": "CLOSED"
}
```

*(Assume current status is `OPEN`.)*

**Response** `409 Conflict`

```json
{
  "message": "Cannot transition from OPEN to CLOSED",
  "code": "INVALID_STATUS_TRANSITION"
}
```

Ticket remains `OPEN` in persistence.

---

### 10.10 Ticket not found

**Request**

```http
GET /api/v1/tickets/00000000-0000-0000-0000-000000000000
```

**Response** `404 Not Found`

```json
{
  "message": "Ticket not found",
  "code": "TICKET_NOT_FOUND"
}
```

---

## Traceability

| API capability | Requirements |
|----------------|--------------|
| Ticket CRUD-like operations | FR-1–FR-4, TR-1–TR-7 |
| Comments | FR-5, TR-8 |
| Search / filter | FR-6, FR-7, TR-10, TR-11 |
| Validation / errors | FR-9, FR-10, VR-*, ER-* |
| Status transitions | SR-*, AC-9, AC-10 + state machine |
| No auth / users API | Requirements §10 Out of Scope |

---

*REST API contract only. Implementation must not expose JPA entities directly ([`spec/architecture.md`](architecture.md)).*
