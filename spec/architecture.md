# Support Ticket Management System — Architecture Specification

This document describes **how the system is structured** and how responsibilities are separated. It implements the behavior defined in [`spec/requirements.md`](requirements.md) and does not add functional requirements beyond that specification.

**Technology (from requirements):** Java 21, Spring Boot backend, REST API, PostgreSQL or H2, React/Next.js or equivalent frontend.

---

## 1. Architecture Overview

### 1.1 Component relationship

The system is a **classic three-tier web application**:

```text
┌─────────────────┐     HTTPS/JSON      ┌──────────────────────┐     JDBC/JPA     ┌─────────────────┐
│  Frontend       │ ◄─────────────────► │  Spring Boot         │ ◄──────────────► │  PostgreSQL     │
│  (React/Next.js │      REST API       │  (REST + services +  │                  │  or H2          │
│   or equivalent)│                     │   persistence)       │                  │                 │
└─────────────────┘                     └──────────────────────┘                  └─────────────────┘
```

- **Frontend:** Presents ticket UI (create, list, detail, update fields, comments, search, status filter). Calls the backend only via the REST API.
- **REST API:** HTTP boundary; JSON request and response bodies; no business authority on the client for status rules or validation outcomes.
- **Spring Boot backend:** Application logic, validation, status state machine enforcement, persistence orchestration.
- **Database:** Durable store for tickets and related data so data **survives application restart** (PR-1, PR-3).

### 1.2 High-level request and response flow

1. User action in the frontend triggers an HTTP request (e.g. list tickets, create ticket, change status).
2. The **controller** receives the request, binds input to DTOs, triggers validation where applicable, and delegates to a **service**.
3. The **service** applies business rules (including status transitions), coordinates **repositories**, and maps between entities and DTOs.
4. The **repository** executes persistence operations against the database.
5. The service returns a result or throws a domain/application exception; the controller returns an HTTP response (success DTO or consistent error payload).
6. The frontend parses the response and updates UI state, including **meaningful error messages** (FR-10, ER-1).

### 1.3 Major layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Frontend (pages/components)** | UX, forms, listing and filtering UI, displaying tickets and errors; calls REST API. |
| **REST API (controllers)** | HTTP mapping, input binding, declarative validation entry point, response status and body; no business rules. |
| **Application services** | Business logic, transactions, status state machine, orchestration, DTO mapping. |
| **Persistence (repositories + entities)** | Load and store domain data; queries for list, filter, search. |
| **Database** | Durable storage. |

*Architectural decision:* Single deployable backend (monolith) is sufficient for assignment scope; no microservices, messaging, or caching.

---

## 2. Backend Architecture

The backend follows a **layered architecture** with strict separation of concerns.

### 2.1 Controller layer

- Exposes REST resources for ticket operations required by [`spec/requirements.md`](requirements.md): create, list, view detail, update fields (title, description, priority, assignee), add comments, search by keyword, filter by status, and status changes as exposed by the API design.
- Accepts JSON request bodies and query parameters; returns JSON response DTOs.
- Applies **`@Valid`** (or equivalent) on request DTOs so structural validation runs at the boundary.
- Delegates all business work to services; remains **thin**.
- Does **not** contain status transition rules, JPQL, or direct entity mutation logic.

### 2.2 Service layer

- **Central location for business logic** (FR-4–FR-7, TR-4–TR-11, SR-1–SR-2).
- Orchestrates create/read/update flows, comment addition, keyword search, and status filtering (via repository calls).
- Enforces **ticket status state machine** before persisting a new status (authoritative enforcement — see Section 6).
- Defines **transaction boundaries** (`@Transactional`): a status change or multi-step update commits or rolls back as a unit.
- Maps entities to response DTOs and request DTOs to entity updates.
- Throws meaningful application exceptions for business failures (e.g. invalid transition, ticket not found) for conversion to REST errors.

### 2.3 Repository layer

- Spring Data JPA (or equivalent) interfaces for tickets, comments, and any supporting persistence needs implied by requirements (e.g. assignee as stored field).
- Implements **list**, **filter by status**, **keyword search**, and **load by id** through derived queries, JPQL, or specifications—without embedding HTTP or state-machine policy (loading current status for the service is appropriate).
- No responsibility for rejecting invalid status transitions; that remains in the service/state-machine component.

### 2.4 Entity / model layer

- JPA entities representing persisted ticket data, comments, and fields required by requirements (title, description, priority, assignee, status, etc.).
- Encodes **persistence structure and relationships** (e.g. ticket has comments) without duplicating orchestration logic.
- Avoids HTTP and UI concerns; minimal behavior limited to persistence-friendly concerns if any.

### 2.5 DTO layer

- **Request DTOs:** create/update ticket, add comment, status change (if modeled separately), search/filter parameters as needed for the API.
- **Response DTOs:** ticket summary for lists, ticket detail for view, comment representations, error-compatible structures.
- Keeps REST contracts **separate from JPA entities** so the API does not expose persistence details directly.

### 2.6 Backend validation

| Concern | Primary layer |
|---------|----------------|
| Format/required fields on API input (Jakarta Bean Validation) | Controller (annotations on DTOs) + framework |
| Business rules (valid status transition, ticket exists) | Service (+ dedicated state-machine helper if used) |
| Persistence constraints (uniqueness, FK) | Database + optional service handling of persistence exceptions |

Validation at the backend satisfies FR-9 and VR-1; failures produce errors consumed by the frontend (FR-10).

### 2.7 Exception handling

- **Centralized** handler (e.g. `@RestControllerAdvice`) maps exceptions and validation failures to **consistent REST error responses** (Section 7).
- Controllers do not catch and swallow business exceptions ad hoc.

### 2.8 State-machine and business-rule handling

- **Status transitions:** Encapsulated in the **service layer**, optionally delegated to a dedicated **state-machine component** (same module, not a separate service tier) that knows allowed transitions from [`spec/requirements.md`](requirements.md) Section 5.
- **Field updates** (title, description, priority, assignee): Service validates input and applies updates; does not bypass status rules when a request includes status change.
- **Search and filter:** Service interprets criteria and invokes repository; no state-machine involvement unless search/filter interact with status (filter by status is a query concern).

---

## 3. Frontend Architecture

A **simple, feature-oriented** frontend suitable for the assignment scope.

### 3.1 Pages and components

| Area | Purpose (maps to requirements) |
|------|--------------------------------|
| **Ticket list page** | List tickets (FR-2); status filter (FR-7); entry to search (FR-6). |
| **Ticket detail page** | View details (FR-3); show comments; actions to update fields (FR-4), add comment (FR-5), change status (SR-1). |
| **Create ticket** | Create flow from UI (AC-1, FR-1)—page or modal per UI choice. |
| **Shared components** | Ticket form fields (title, description, priority, assignee), comment form, status control, error banner/inline messages, loading states. |

*Architectural decision:* No requirement for a specific routing library; Next.js App/Pages router or equivalent is acceptable.

### 3.2 API communication

- Single **API client module** (fetch or axios) with base URL from environment configuration.
- Functions aligned to REST operations: list, get by id, create, update, add comment, search, filter—without embedding backend business rules beyond what the API documents for UX hints.

### 3.3 State management

- **Lightweight approach:** React component state + context or simple hooks for shared list/detail data.
- Server state refreshed after mutations (create, update, comment, status change).
- No requirement for Redux or global stores unless the team prefers them; keep complexity low.

### 3.4 Form handling

- Controlled inputs for create/update ticket and add comment.
- Submit handlers call API client; disable submit while request in flight.
- On success, navigate or refresh detail/list per UX choice.

### 3.5 Client-side error handling

- Distinguish **network errors**, **HTTP 4xx/5xx**, and **validation error payloads** from the backend.
- Do not treat failed status transitions as success; surface backend message (ER-1).

### 3.6 Displaying meaningful backend errors

- Map backend error structure to user-visible text (field-level for validation, summary message for business errors such as invalid transition).
- Avoid showing raw stack traces or internal details.
- Frontend may **disable or hide** UI actions that are likely invalid (e.g. no “reopen” if not in API), but **must not rely on UI alone** for status rules—the backend remains authoritative (SR-2).

---

## 4. Database Architecture

### 4.1 Backend–database communication

- Spring Boot uses **Spring Data JPA** (Hibernate) with a JDBC driver to PostgreSQL or H2.
- Repositories abstract SQL/JPQL; services depend on repositories, not raw JDBC in controllers.

### 4.2 Persistence approach

- **Relational database** stores tickets and comments (and assignee representation as required by implementation).
- Schema evolution via migrations (e.g. Flyway/Liquibase) or equivalent is an **implementation choice**; architecture requires durable tables, not in-memory-only storage for production-like runs.
- **Transactions** at the service layer ensure status updates and related writes are atomic.

### 4.3 Data survival across restarts

- Data is written to the database file (H2) or PostgreSQL server **before** the API reports success.
- On restart, the same database connection configuration reloads existing rows (AC-11, PR-3).

### 4.4 PostgreSQL vs H2

| Environment | Typical use |
|-------------|-------------|
| **H2** | Local development and automated tests; optional file-based H2 for persistence across restarts during dev. |
| **PostgreSQL** | Closer to deployment-style persistence; connection via URL, user, password from configuration (Section 9). |

Selection is via **Spring profiles** and configuration properties, not hardcoded in code.

*This document does not define table names or columns; entities implement the persistence needed for requirements.*

---

## 5. Package Structure

Proposed **single-module** Spring Boot layout (package names illustrative; root example `com.example.tickets`):

```text
com.example.tickets
├── TicketApplication.java          (bootstrap — implementation artifact, not specified here)
├── config/                         (datasources, JPA, profile-specific beans)
├── web/
│   └── controller/                 (REST controllers)
├── service/
│   └── (optional) statemachine/    (status transition rules)
├── repository/                     (Spring Data JPA interfaces)
├── domain/
│   └── entity/                     (JPA entities)
├── dto/
│   ├── request/
│   └── response/
├── exception/                      (custom exceptions, RestControllerAdvice)
└── mapper/                         (optional: entity ↔ DTO mapping)
```

| Package | Separation |
|---------|------------|
| `web.controller` | HTTP only |
| `service` | Business logic, transactions, state machine invocation |
| `repository` | Persistence access |
| `domain.entity` | Persistence model |
| `dto` | API contracts |
| `exception` | Error model and global handling |
| `service.statemachine` (optional) | Pure transition rules testable without web or DB |

Validation annotations live on **request DTOs** in `dto.request`; no separate `validation` package is required unless custom validators grow large.

---

## 6. State Machine Architecture

### 6.1 Authoritative rules (from requirements)

**Valid transitions:**

```text
OPEN → IN_PROGRESS → RESOLVED → CLOSED
OPEN → CANCELLED
IN_PROGRESS → CANCELLED
```

Equivalently:

| From | Allowed to |
|------|------------|
| OPEN | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | RESOLVED, CANCELLED |
| RESOLVED | CLOSED |
| CLOSED | (none per assignment examples) |
| CANCELLED | (none per assignment examples) |

**Invalid examples (must be rejected by backend):** `CLOSED → OPEN`, `RESOLVED → OPEN`, `CANCELLED → OPEN`, and any transition not listed above.

### 6.2 Where enforcement lives

1. **Service layer** receives a request to change status (or update that includes status).
2. Service loads **current status** from persistence (via repository).
3. Service invokes **transition validation** (inline or dedicated state-machine component): `(currentStatus, requestedStatus)` must be allowed.
4. If **invalid:** no status persist; throw business exception → REST error (SR-2, AC-10).
5. If **valid:** update entity status, save within transaction, return updated ticket DTO (SR-1, AC-9).

The **backend is the only authority** for whether a transition is legal (SR-2).

### 6.3 Frontend interaction

- Frontend sends the **desired status** (or action that maps to status) to the API.
- UI may show only **likely** next statuses for usability; if the user triggers a disallowed transition (stale UI, API misuse), the backend rejects and the UI displays the error message.
- Frontend **does not** implement a second copy of the full state machine as the source of truth; optional UI hints must stay in sync with API behavior but enforcement remains server-side.

### 6.4 Testing alignment

State-machine integration tests (AC-14) exercise **service + persistence** (and optionally full API) to prove valid transitions persist and invalid transitions do not change stored status.

---

## 7. Error Handling Architecture

### 7.1 Backend validation and business-rule errors

| Type | Origin | Typical handling |
|------|--------|------------------|
| **Bean Validation** | Invalid request DTO | 400 response with field errors |
| **Invalid status transition** | Service / state machine | 4xx with clear message (e.g. conflict or bad request—exact code is implementation detail) |
| **Ticket not found** | Service on load by id | 404 with message |
| **Unexpected failure** | Infrastructure | 500 with generic message; details logged server-side only |

### 7.2 Consistent REST responses

- **`@RestControllerAdvice`** (or equivalent) converts exceptions to a **single error JSON shape** used across endpoints: e.g. status, message, optional `errors[]` with `field` and `message` for validation.
- Success responses use response DTOs; errors never leak stack traces or SQL (ER-3, AC-15).

### 7.3 Validation error representation

- List of field-level errors for multi-field failures; single message for single-field or global validation.
- Aligns with FR-9 and supports FR-10 when the frontend maps fields to form inputs.

### 7.4 Invalid status transitions

- Treated as **business rule failures**, not validation of JSON shape.
- Response includes a **meaningful, user-facing message** (e.g. that the transition from current status to requested status is not allowed).
- Persisted status **unchanged** after rejection.

### 7.5 Frontend interpretation

- API client normalizes error payloads.
- Forms show inline errors for validation; toasts or banners for business errors.
- Status actions on failure refresh ticket detail from server to show true current status.

---

## 8. Testing Architecture

Tests validate layers without requiring every scenario at every layer (see project `rules/testing.md` when implemented).

| Test type | Primary layer validated | Scope |
|-----------|-------------------------|--------|
| **Unit tests** | State-machine component, pure mappers, small helpers | No Spring context; fast transition matrix for all valid/invalid pairs from requirements |
| **Service-layer tests** | Service + mocked repositories | Business rules, validation orchestration, exception on invalid transition, successful updates |
| **Controller / API tests** | REST boundary (`@WebMvcTest`) | HTTP status, JSON shape, `@Valid` failures, error payload; service mocked |
| **Repository / persistence tests** | Repository + database (`@DataJpaTest` or Testcontainers) | Queries for list, filter by status, keyword search, comment persistence |
| **Integration tests** | Multiple layers + Spring context | End-to-end flows: create ticket, persist, restart simulation via same DB |
| **State-machine integration tests** | Service + real DB (required AC-14) | Valid transitions update stored status; invalid transitions leave DB unchanged; optional full REST path |

*Architectural decision:* State-machine rules are covered by **unit tests** on the transition logic plus **integration tests** that prove persistence behavior; controller tests confirm API contract for rejection responses.

---

## 9. Configuration and Secrets

### 9.1 Database configuration

- **URL, username, password, driver** supplied via `application.yml` / `application-{profile}.properties` with **placeholders** or environment variable substitution.
- **Profile `dev`:** H2 (in-memory or file) acceptable.
- **Profile `prod` or `local-pg`:** PostgreSQL connection settings.
- No credentials in source control (AC-15).

### 9.2 Application configuration

- Server port, CORS for frontend origin (if needed for local dev), JPA ddl/migration settings per profile.
- Frontend: `NEXT_PUBLIC_API_BASE_URL` or equivalent for REST base URL.

### 9.3 Development and test

- **`application-test.yml`:** H2 or test PostgreSQL; isolated schema for integration tests.
- Tests use test profile; no production secrets in test resources committed to the repo.

### 9.4 Secrets handling

| Mechanism | Use |
|-----------|-----|
| Environment variables | DB password, any API keys if added later |
| `.env` (gitignored) | Local developer overrides |
| CI/CD secret store | Pipeline deployments (out of assignment minimum) |

*Out of scope per requirements:* authentication and authorization configuration.

---

## 10. Request Flow Examples

### 10.1 Creating a ticket

```text
User submits create form
  → Frontend: POST JSON (create request DTO) to REST API
  → Controller: bind body, @Valid, call TicketService.create(...)
  → Service: map DTO to entity, set initial status per implementation (must support state machine from creation onward), @Transactional save
  → Repository: INSERT ticket
  → Database: row persisted
  → Service: map entity to response DTO
  → Controller: 201/200 + JSON body
  → Frontend: show success, redirect to list or detail; on validation error, show field messages
```

*Requirement traceability:* FR-1, FR-8, FR-9, AC-1, AC-11.

### 10.2 Updating a ticket status

```text
User selects new status (or action mapped to status)
  → Frontend: request to REST API (e.g. PATCH/PUT or dedicated status resource)
  → Controller: bind input, validate shape, delegate to TicketService.transitionStatus(ticketId, newStatus) [or equivalent]
  → Service: load ticket via Repository (current status from DB)
  → Service: State machine — if (current, new) not allowed → throw business exception (no save)
  → RestControllerAdvice: map to error response → Frontend displays meaningful error (AC-10, ER-1)
  → If allowed: update status on entity, Repository save, transaction commit
  → Controller: return updated ticket DTO
  → Frontend: refresh detail view with new status
```

*Requirement traceability:* SR-1, SR-2, AC-9, AC-10.

### 10.3 Adding a comment

```text
User submits comment on ticket detail page
  → Frontend: POST comment request to REST API (scoped to ticket id)
  → Controller: @Valid on comment DTO, call CommentService or TicketService.addComment(...)
  → Service: verify ticket exists (load by id), create comment linked to ticket, @Transactional save
  → Repository: persist comment (and flush with ticket if needed)
  → Database: comment stored with association to ticket
  → Service: return updated detail or comment DTO
  → Controller: success response
  → Frontend: append comment to detail view or refetch ticket
```

*Requirement traceability:* FR-5, AC-6.

### 10.4 Searching tickets

```text
User enters keyword in search UI
  → Frontend: GET (or POST if design chooses) with keyword query parameter
  → Controller: parse query params, call TicketService.search(keyword, optional filters)
  → Service: invoke Repository search method (keyword match per implementation; requirements specify keyword only)
  → Repository: query database (JPQL/SQL/specification)
  → Database: returns matching rows
  → Service: map entities to list/summary DTOs
  → Controller: 200 + JSON array/page
  → Frontend: render search results

Status filtering (FR-7) follows the same pattern with status passed as a filter parameter to list/search operations at Service → Repository.
```

*Requirement traceability:* FR-6, FR-7, AC-7, AC-8.

---

## Traceability summary

| Architecture topic | Requirements reference |
|--------------------|-------------------------|
| REST + layered backend | Scope, FR-1–FR-11 |
| Backend validation & UI errors | FR-9, FR-10, VR-*, ER-* |
| Persistence & restart | FR-8, PR-* |
| Status state machine | Section 5, SR-*, AC-9, AC-10, AC-14 |
| No auth / no extra features | Section 10 Out of Scope |
| No secrets in repo | AC-15 |

---

*This architecture specification supports implementation of [`spec/requirements.md`](requirements.md) only. API paths, entity fields beyond requirements, and UI styling are left to implementation within these boundaries.*
