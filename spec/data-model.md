# Support Ticket Management System — Data Model Specification

This document defines **what data is persisted** and **how persisted data is related**. It is derived only from [`spec/requirements.md`](requirements.md) and [`spec/architecture.md`](architecture.md).

**This is a data model specification only.** It does not define Java entities, SQL, migrations, or implementation code.

Status **transition rules** are not defined here; they belong exclusively in [`spec/state-machine.md`](state-machine.md) (when present) and are enforced in the application service layer per the architecture specification.

---

## 1. Data Model Overview

### 1.1 Purpose of the persistence model

The persistence model exists to **store ticket and comment data in a relational database** (PostgreSQL or H2) so that:

- Tickets can be created, listed, viewed, and updated (FR-1–FR-4, FR-8).
- Comments can be added and shown with ticket details (FR-5).
- Tickets can be **searched by keyword** and **filtered by status** (FR-6, FR-7).
- **Current ticket status** is stored and read for display and for server-side transition checks (TR-9; enforcement in services, not in the database).
- Data **survives application restart** (PR-3, AC-11).

### 1.2 Core entities

The assignment requires a **minimal** model of two logical entities:

| Entity | Role |
|--------|------|
| **Ticket** | Primary aggregate for support requests; holds title, description, priority, assignee, and status. |
| **Comment** | Text contributed to a ticket; always associated with exactly one ticket. |

No additional entities (users, roles, categories, attachments) are required by the specifications.

### 1.3 Support for functional requirements

| Requirement | Data model support |
|-------------|-------------------|
| FR-1 / TR-1 Create ticket | Persisted `Ticket` row with required ticket attributes and status. |
| FR-2 / TR-2 List tickets | Query over `Ticket` records. |
| FR-3 / TR-3 View details | Load `Ticket` by identifier; load related `Comment` records. |
| FR-4 / TR-4–TR-7 Update fields | Updatable columns/attributes: title, description, priority, assignee. |
| FR-5 / TR-8 Add comments | Insert `Comment` linked to ticket. |
| FR-6 / TR-10 Keyword search | Search over persisted ticket text (see Section 7). |
| FR-7 / TR-11 Status filter | Filter on persisted `status` value. |
| FR-8 / PR-1 Persist data | Tickets and comments stored in database. |
| TR-9 Status state machine | `status` field holds current state; transitions validated in application layer. |

### 1.4 Relationship to application architecture

Per [`spec/architecture.md`](architecture.md):

- **JPA entities** (implementation) mirror this logical model in `domain.entity`.
- **Repositories** read and write `Ticket` and `Comment` data; search and status filter are query operations on stored fields.
- **Services** map between DTOs and persisted data, enforce status rules before updating `status`, and orchestrate comment creation.
- **DTOs** expose API shapes; the REST API does not expose persistence details directly.

The data model does **not** encode transition rules in the database (no trigger-based state machine required by spec); the stored `status` is the **current state** only.

---

## 2. Ticket Entity

### 2.1 Purpose

A **Ticket** represents a single support ticket record: the unit of work users create, list, view, update, search, and filter. It holds the assignable and descriptive attributes required by the assignment and the ticket’s **current status**.

### 2.2 Fields

Only fields required or implied by the specifications are included. A **stable identifier** is included because the architecture assumes load-by-id flows (detail view, comments scoped to a ticket, updates); it is a persistence identifier, not an additional business attribute beyond the assignment field list.

| Field name | Purpose / meaning | Suggested logical type | Required |
|------------|-------------------|------------------------|----------|
| `id` | Unique identity of the ticket for retrieval, updates, and comment association. | Opaque identifier (e.g. UUID or numeric surrogate) | Required (system-assigned on create) |
| `title` | Short summary of the ticket (TR-4). | Text | Required |
| `description` | Longer explanation of the issue or request (TR-5). | Text | Required |
| `priority` | Priority of the ticket (TR-6). Requirements do not define allowed values. | Text or enumerated string stored as text | Required |
| `assignee` | Who the ticket is assigned to (TR-7); assignee can be changed. Requirements do not define format (no separate user entity). | Text | Optional at persistence level if the application allows unassigned tickets; if the product requires an assignee on every ticket, validation enforces required at create/update (VR-1) |
| `status` | Current lifecycle state of the ticket (TR-9). | Enumerated value (see Section 4) | Required |

**Not included (not required by specifications):** due date, category, reporter, tags, soft-delete flags, version columns, audit user ids, or other workflow metadata.

### 2.3 Derived usage (not separate fields)

| Capability | How the model supports it |
|------------|---------------------------|
| List tickets | Read all `Ticket` rows (with optional pagination at API/repository layer). |
| Ticket details | Read one `Ticket` by `id` plus related `Comment` rows. |
| Keyword search (FR-6) | Query tickets using keyword against persisted text; which ticket attributes participate is an implementation choice constrained by “search by keyword” (Section 7). |
| Status filtering (FR-7) | Query tickets where `status` equals the filter value. |

---

## 3. Comment Entity

### 3.1 Purpose

A **Comment** represents user-provided text attached to a ticket (FR-5, TR-8). Comments are **added** only; the requirements do not include edit or delete.

### 3.2 Fields

| Field name | Purpose / meaning | Suggested logical type | Required |
|------------|-------------------|------------------------|----------|
| `id` | Unique identity of the comment for persistence and API referencing. | Opaque identifier (e.g. UUID or numeric surrogate) | Required (system-assigned on create) |
| `ticketId` | Reference to the parent ticket. | Same type as `Ticket.id` | Required |
| `body` | Comment text content. | Text | Required |

**Not included:** comment author entity, author user id, edit history, or attachments—the specifications do not require a separate comment author model.

### 3.3 Relationship to Ticket

- **Cardinality:** Each `Comment` belongs to **exactly one** `Ticket`.
- **Cardinality:** Each `Ticket` may have **zero or more** `Comment` records.
- **Referential integrity:** A `Comment` must not exist without a valid `Ticket`; if a ticket identifier does not exist, the operation is rejected at the application layer (architecture: verify ticket exists before save).

Ordering of comments on the detail view is a presentation concern; the specifications do not require a timestamp field. If implementation needs stable ordering, that is an implementation detail outside this minimal model unless added in a future spec.

---

## 4. Ticket Status Representation

### 4.1 Purpose of the status field

`Ticket.status` stores the **current** state of the ticket in the lifecycle (TR-9). It is used for:

- Display on list and detail screens.
- **Filtering** tickets by status (FR-7, TR-11).
- Loading current state before a **requested status change**; the service compares current and requested values and applies rules defined in [`spec/state-machine.md`](state-machine.md).

The data model stores **one value per ticket**; it does not store transition history unless a future specification requires it.

### 4.2 Allowed status values

The assignment requires these statuses:

```text
OPEN
IN_PROGRESS
RESOLVED
CLOSED
CANCELLED
```

### 4.3 Logical representation

| Approach | Description |
|----------|-------------|
| **Recommended logical type** | Closed enumeration / enum with exactly the five values above. |
| **Persistence** | Store as a constrained string or database enum type with the same five values. |

Every persisted ticket must have `status` set to one of these values at all times after creation.

### 4.4 Persistence-level considerations

- **Constraint:** Database or application mapping should reject values outside the five statuses (supports data integrity; transition validity remains in the service layer).
- **Updates:** Only the application service updates `status` after transition validation; invalid transitions must not be written (SR-2, AC-10).
- **Transition rules:** Which moves between statuses are legal are **not** defined in this document; see [`spec/state-machine.md`](state-machine.md).

---

## 5. Entity Relationships

### 5.1 Conceptual model

```text
┌─────────────────┐         1     *        ┌─────────────────┐
│     Ticket      │────────────────────────│    Comment      │
│                 │                        │                 │
│  id (PK)        │                        │  id (PK)        │
│  title          │                        │  ticketId (FK)  │
│  description    │                        │  body           │
│  priority       │                        └─────────────────┘
│  assignee       │
│  status         │
└─────────────────┘
```

### 5.2 Relationship summary

| From | To | Type | Description |
|------|-----|------|-------------|
| Ticket | Comment | One-to-many | A ticket owns many comments; each comment references one ticket via `ticketId`. |

No many-to-many or ticket-to-ticket relationships are required.

---

## 6. Assignee Representation

Requirements treat **assignee as a field on the ticket** (FR-4, TR-7), not as a separate user-management subsystem (requirements Section 10 Out of Scope).

| Decision | Specification alignment |
|----------|-------------------------|
| **Storage** | Single `assignee` attribute on `Ticket` (text). |
| **No User entity** | Not required; no persisted user directory, roles, or authentication data. |
| **Updates** | Changing assignee updates the `assignee` column/attribute only (AC-5). |

Format (name, email, free text) is left to implementation and backend validation (VR-1).

---

## 7. Search and Filtering (Data Perspective)

### 7.1 Status filtering

- **Filter input:** A status value from the set in Section 4.2.
- **Persistence operation:** Equality (or equivalent) predicate on `Ticket.status`.
- Satisfies FR-7 and TR-11.

### 7.2 Keyword search

- **Requirement:** Search tickets **by keyword** (FR-6, TR-10).
- **Persistence:** Keyword matching runs against **persisted ticket data**. The requirements do not specify which ticket fields are indexed for search; the architecture notes that keyword match is an implementation choice within that constraint.
- **Logical implication:** At minimum, searchable content must exist on the ticket (e.g. `title` and/or `description`); search does not require a separate search-index entity for assignment scope.
- **Comments:** Requirements specify search **tickets** by keyword, not search within comments; including comment text in ticket search is **not** required unless a future spec says so.

---

## 8. Persistence and Integrity

### 8.1 Storage technology

- **PostgreSQL** or **H2** (PR-2), accessed via Spring Data JPA as described in the architecture specification.
- Data is written to durable storage so rows remain after process restart (PR-3).

### 8.2 Integrity rules (logical)

| Rule | Rationale |
|------|-----------|
| `Ticket.id` unique | Identify tickets for CRUD and comments. |
| `Comment.id` unique | Identify comment records. |
| `Comment.ticketId` references existing `Ticket.id` | Comments belong to tickets (FR-5). |
| `Ticket.status` ∈ {OPEN, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED} | Valid domain states only. |

The specifications do **not** require ticket deletion or comment deletion; cascade-delete behavior is an implementation choice if delete is ever added outside current scope.

### 8.3 What is not persisted

Per requirements out of scope and minimal model:

- Authentication sessions, credentials, or roles.
- Status transition history or audit log (unless added later).
- Deleted-ticket tombstones (delete not in scope).
- Notification or message queue state.

---

## 9. Traceability

| Data model element | Requirements | Architecture |
|------------------|--------------|--------------|
| Ticket + fields | FR-1–FR-4, FR-6–FR-8, TR-1–TR-11 | §2.4, §4.2, §10 |
| Comment | FR-5, TR-8 | §2.3, §10.3 |
| Status values | §5 Status Requirements | §6 State Machine |
| Assignee as field | FR-4, TR-7, Out of Scope (no user mgmt) | §2.3, §4.2 |
| Two-entity model | FR-8, comment on ticket | §2.4, §5 package structure |

---

*This data model specification supports [`spec/requirements.md`](requirements.md) and [`spec/architecture.md`](architecture.md). Transition matrices and rejection behavior are defined only in [`spec/state-machine.md`](state-machine.md).*
