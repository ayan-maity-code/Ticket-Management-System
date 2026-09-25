# API Standards

Reusable REST API development guidelines for AI-assisted work on this Support Ticket Management System (Java 21, Spring Boot). Follow these rules when designing, documenting, or implementing HTTP APIs.

**Authoritative source:** When an OpenAPI spec, API design doc, README, or existing controllers define behavior, **follow that specification first**. These guidelines fill gaps and enforce consistency—they do not override documented project APIs unless a task explicitly changes the contract.

---

## 1. REST API Design

- Model APIs around **resources** (nouns) and their **representations**, not around internal service method names.
- Prefer **stateless** requests: each call carries enough context (auth, ids, filters); avoid server-side “session” for REST semantics unless the project already uses that pattern.
- Use **JSON** as the default representation (`Content-Type: application/json`) unless the project defines otherwise.
- Keep endpoints **predictable**: similar resources behave similarly (CRUD, list, sub-resources).
- Expose **stable contracts** via request/response DTOs and documented status codes; hide persistence and internal packages.
- Version APIs only when the project adopts a versioning strategy (URL prefix, header, or media type)—do not introduce versioning without an explicit requirement.
- Idempotent operations should be safe to retry where HTTP semantics allow (GET, PUT, DELETE on a single resource).

---

## 2. URL and Resource Naming

- Use **plural nouns** for collections: `/tickets`, `/users`—match existing paths in the codebase.
- Use **lowercase** paths; separate words with **hyphens** if multi-word (`/ticket-comments`) or follow the project’s established style (camelCase is discouraged for URLs).
- Represent **hierarchy** when a resource is logically scoped: `/tickets/{ticketId}/comments`—only when nested ownership is part of the spec; avoid deep nesting (prefer flat resources with query filters when depth exceeds two levels).
- Do not use **verbs** in paths (`/createTicket`, `/getTickets`); use HTTP methods instead.
- Do not expose **implementation details** in URLs (table names, internal service names, `.jsp`, file extensions).
- **Trailing slashes:** be consistent with existing APIs (Spring often accepts both; pick one style per project).

| Prefer | Avoid |
|--------|--------|
| `/tickets` | `/ticket`, `/getAllTickets` |
| `/tickets/{ticketId}` | `/tickets/getById/{id}` |
| `/tickets?status=OPEN` | `/tickets/open` (unless spec defines sub-resources) |

---

## 3. HTTP Methods

| Method | Typical use | Notes |
|--------|-------------|--------|
| **GET** | Retrieve resource(s) | Safe, idempotent; no request body for standard reads |
| **POST** | Create resource or non-idempotent action | Returns 201 + `Location` when creating a single resource if project standard |
| **PUT** | Full replace of a resource | Idempotent; send complete representation per spec |
| **PATCH** | Partial update | Use when spec allows partial fields; document merge semantics |
| **DELETE** | Remove resource | Idempotent; 204 No Content or 200 with body per project convention |

- Do not use **GET** for operations that change state.
- Do not overload **POST** for reads unless the project already uses complex search-via-POST; prefer GET with query params for searches when practical.
- Align method choice with **existing endpoints** before adding new ones.

---

## 4. HTTP Status Codes

Use status codes that match **HTTP semantics** and existing error handling.

| Code | When to use |
|------|-------------|
| **200 OK** | Successful GET, PUT, PATCH, DELETE with body (if any) |
| **201 Created** | Resource created via POST; include identifier in body and/or `Location` header per spec |
| **204 No Content** | Successful DELETE or update with no response body |
| **400 Bad Request** | Malformed JSON, Bean Validation failures, invalid query/path format |
| **401 Unauthorized** | Missing or invalid authentication |
| **403 Forbidden** | Authenticated but not allowed to perform the action |
| **404 Not Found** | Resource does not exist (or not visible to caller—per security spec) |
| **409 Conflict** | Duplicate create, state conflict, version mismatch |
| **422 Unprocessable Entity** | Use only if the project standardizes on it for semantic validation errors |
| **500 Internal Server Error** | Unexpected server failure—avoid for business rule violations |

- Do not return **200** with an error payload unless the project already uses envelope patterns—prefer proper status codes.
- Do not leak stack traces or SQL in any response.

---

## 5. Request DTOs

- Define dedicated **request** types for create/update/command operations (`CreateTicketRequest`, `UpdateTicketRequest`, `AssignTicketRequest`).
- Name types by **intent** (`*Request`, `*Command`) consistent with the codebase.
- Include only fields **clients are allowed to set**—prevent mass assignment of server-managed fields (`id`, `createdAt`, internal flags).
- Use **Jakarta Bean Validation** annotations on DTOs; validate with `@Valid` on controller parameters.
- Prefer **immutable** request models (`record`) when the project uses records for DTOs.
- Document required vs optional fields in OpenAPI/spec when present; implementation must match spec.

---

## 6. Response DTOs

- Return **response** types tailored to clients (`TicketResponse`, `TicketSummaryResponse`, `PagedTicketResponse`).
- Exclude **lazy relations**, persistence-only fields, and internal enums not meant for clients unless spec requires them.
- Use **consistent field naming** (camelCase in JSON via Jackson defaults) and **date/time formats** (ISO-8601 instant/offset) per project config.
- For lists, return a **wrapper** or structured page object when pagination applies—do not return raw unbounded arrays for large collections.
- **201 Created** responses should include the created resource representation or at least its id, per spec.
- Map entity → response in the **service or mapper layer**, not by returning entities from controllers.

---

## 7. Validation Errors

- Reject invalid input with **400 Bad Request** (or project-standard code) before business logic runs when validation is syntactic/structural.
- Return a **structured** list of field-level errors when multiple constraints fail.
- Field keys should match **JSON property names** clients send (e.g. `title`, not `getTitle`).
- Include a **human-readable message** per field; use message keys or codes only if the project i18n pattern requires it.
- Do not return validation errors as plain text or unstructured HTML.
- Test validation against **documented** rules—do not add constraints in the API layer that contradict the spec.

---

## 8. Consistent Error Response Structure

Align with the project’s **`@ControllerAdvice`** / problem-detail format. When no project type exists yet, prefer a single shape across all endpoints, for example:

- `timestamp` or `traceId` (if used for support, not for security bypass)
- `status` (HTTP status numeric)
- `error` or `title` (short category)
- `message` (safe, user-facing summary)
- `path` (request path, optional)
- `errors` (array of `{ field, message }` for validation)

Rules:

- **Same envelope** for 4xx/5xx from application code unless spec defines variants per resource.
- **Business exceptions** map to the same structure with appropriate status (404, 409, etc.).
- Never include **passwords, tokens, connection strings**, or full exception messages from third-party libraries in client responses.
- Log detailed errors **server-side**; keep client payloads concise and actionable.

---

## 9. Pagination

Apply pagination to **collection endpoints** that may grow without bound, unless the spec explicitly returns a fixed small set.

- Use **query parameters** consistent with Spring Data and existing APIs, commonly:
  - `page` (0-based or 1-based—**match the project**)
  - `size` or `limit`
  - `sort` (e.g. `createdAt,desc`)
- Response should include **metadata**: total elements/pages (when available), current page, page size, and the **content** array.
- Enforce **maximum page size** to protect the server; document the cap.
- Default sort order should be **defined** (e.g. newest first) and stable for clients.
- Return **200** with empty `content` for valid pages beyond data—not 404 unless spec says otherwise.

---

## 10. Search and Filtering

- Prefer **query parameters** for filters: `?status=OPEN&assigneeId=...&priority=HIGH`.
- Use **clear, documented** parameter names; avoid ambiguous abbreviations.
- Support **combining** filters only when spec defines semantics (AND vs OR).
- For **full-text or complex queries**, use POST to a search sub-path (`/tickets/search`) only if documented; otherwise extend GET filters.
- Validate filter values (enum names, UUID format, date ranges) and return **400** with clear errors for invalid combinations.
- Do not expose **raw SQL** or internal column names as filter keys.
- Document **default behavior** when filters are omitted (e.g. all visible tickets for the user).

---

## 11. Path Variables

- Use path variables for **resource identity**: `/tickets/{ticketId}`.
- Name variables meaningfully in code (`ticketId`) and match OpenAPI `name` attributes.
- Validate format early (**UUID**, numeric id) where applicable; invalid format → **400**, unknown id → **404** (per security and spec).
- Do not encode **filtering** in path segments when query parameters are clearer (`/tickets/open` vs `?status=OPEN`—follow spec).
- Sub-resource ids: `/tickets/{ticketId}/attachments/{attachmentId}` when hierarchy is required.

---

## 12. Query Parameters

- Use query params for **optional** modifiers: pagination, sort, filter, sparse field sets (if supported).
- Distinguish **missing** param (default behavior) from **empty** or invalid value (400).
- Boolean params: document accepted values (`true`/`false`); avoid ambiguous `1`/`0` unless already standard.
- Collection params: follow Spring style (`status=OPEN&status=CLOSED` or `status=OPEN,CLOSED`) per existing API.
- Required query params are rare for REST; prefer sensible defaults or path variables for required identity.

---

## 13. Request Bodies

- **POST / PUT / PATCH** accept JSON bodies mapped to request DTOs.
- Reject **unknown properties** if the project enables `FAIL_ON_UNKNOWN_PROPERTIES`—document client impact.
- **Empty body** on methods that require a body → **400**.
- **Content-Type** must be `application/json` (or supported types); wrong type → **415** if handled.
- Large payloads: respect server limits; document max attachment sizes on separate upload endpoints if applicable.
- Do not accept **client-supplied primary keys** on create unless spec allows (e.g. client-generated UUID).

---

## 14. Avoid Exposing Database Entities Directly

- **Never** return JPA entities from REST controllers as the default pattern.
- Reasons: lazy-loading serialization failures, accidental exposure of fields, coupling to schema changes, circular references.
- Use **response DTOs** and explicit mapping; expose only fields in the API contract.
- Similarly, avoid binding request bodies directly to **entities**—use request DTOs and map in the service layer.
- Internal ids in responses: use the type and format defined in spec (UUID string, long, etc.).

---

## 15. API Backward Compatibility

- **Do not break** existing clients without an explicit versioning or migration task.
- Safe changes: add optional fields to responses, add new endpoints, add optional query params with defaults.
- Breaking changes: remove/rename fields, change types, change status codes, change URL paths, tighten validation, change pagination defaults.
- For breaking changes: require **version bump**, deprecation period, or coordinated client updates per project policy.
- When extending resources, prefer **additive** DTO fields with clear optional semantics in OpenAPI.
- Deprecate via documentation and headers (`Deprecation`, `Sunset`) only if the project uses them.

---

## 16. Meaningful API Error Messages

- Messages should help **API consumers** fix the request or understand denial—not debug the server.
- Good: `"Title is required"`, `"Ticket not found"`, `"Cannot transition from CLOSED to OPEN"`.
- Bad: `"NullPointerException"`, `"Query failed"`, `"Error in TicketServiceImpl line 42"`.
- Use **stable machine-readable codes** (`errorCode: TICKET_NOT_FOUND`) when the spec defines them—for clients to branch logic.
- **403 vs 404:** follow project security guidance (hide existence vs reveal forbidden).
- Repeat the same phrasing for the same failure across endpoints when the condition is the same.

---

## AI-Assisted API Development Rules

Before creating or modifying an endpoint:

1. **Locate the API specification** (OpenAPI/Swagger, design docs, existing `*Controller` classes, integration tests).
2. **Match** URL patterns, DTO names, status codes, error shape, and pagination params to existing resources.
3. **Read** `@ControllerAdvice`, shared error DTOs, and Jackson configuration.
4. Plan the **smallest change**: new fields or endpoints rather than redesigning the API surface.

While implementing:

- **Do not invent** new resources, fields, statuses, or error codes not in spec or task scope.
- **State assumptions** when the spec is silent (pagination base index, sort defaults, 404 vs 403).
- **Do not** expose entities, change unrelated endpoints, or rename public JSON properties without a compatibility plan.
- Align validation messages and HTTP status with **existing** ticket/user endpoints.
- Update or suggest **OpenAPI** and **tests** (`@WebMvcTest`) when the contract changes.

After implementing:

- Verify **consistency**: same error envelope, same pagination wrapper, same naming as sibling endpoints.
- Note any **spec drift** explicitly for human review.

### Restrictions

This document is **guidelines only**. It does not define ticket fields, workflows, or status values. Do not generate controllers, DTO implementations, or business logic as part of authoring this file.

---

## Quick reference checklist

Before submitting API changes, confirm:

- [ ] Spec and existing controllers reviewed; changes align or document intentional contract updates
- [ ] Plural resource URLs; correct HTTP method and status codes
- [ ] Request/response DTOs; no entity leakage
- [ ] `@Valid` validation; structured 400 errors matching project envelope
- [ ] Lists paginated/filtered per project conventions
- [ ] Path/query params named and validated consistently
- [ ] Error messages safe and meaningful; no internal details
- [ ] Backward compatibility considered for existing clients
- [ ] Smallest API surface change; no unrequested endpoints

---

## Relationship to other guidelines

- **`rules/java-springboot.md`** — Layering, DTO mapping, exception handling, security.
- **`rules/testing.md`** — Controller/API tests, validation and error response assertions.
