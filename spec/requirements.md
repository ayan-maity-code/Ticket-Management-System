# Support Ticket Management System — Requirements Specification

## 1. Purpose

This document defines the requirements for a **Support Ticket Management System** developed as part of a **Spec-Driven Development assignment**. It describes what the system must do so that implementation, testing, and acceptance can be traced to agreed behavior.

## 2. Scope

The assignment deliverable is a Support Ticket Management System that:

- Is built with **Java 21** and **Spring Boot**.
- Persists data using **PostgreSQL** or **H2**.
- Exposes a **REST API**.
- Provides a user interface using **React/Next.js** or an equivalent frontend.

In scope: ticket lifecycle operations (create, list, view, update fields, comments), keyword search, status filtering, backend input validation, meaningful error display in the UI, database persistence with data surviving application restart, and enforcement of the defined ticket status state machine (including rejection of invalid transitions).

## 3. Functional Requirements

The system must support the following:

| ID | Requirement |
|----|-------------|
| FR-1 | **Create a ticket.** |
| FR-2 | **List tickets.** |
| FR-3 | **View ticket details.** |
| FR-4 | **Update ticket fields:** Title, Description, Priority, Assignee. |
| FR-5 | **Add comments to a ticket.** |
| FR-6 | **Search tickets by keyword.** |
| FR-7 | **Filter tickets by status.** |
| FR-8 | **Persist ticket data in a database.** |
| FR-9 | **Validate input at the backend.** |
| FR-10 | **Display meaningful errors in the UI.** |

## 4. Ticket Requirements

Based on the functional requirements and status behavior described in the assignment:

| ID | Requirement |
|----|-------------|
| TR-1 | The system must allow **creation** of tickets (FR-1). |
| TR-2 | The system must support **listing** tickets (FR-2). |
| TR-3 | The system must support **viewing details** of a ticket (FR-3). |
| TR-4 | The system must allow updating a ticket’s **Title** (FR-4). |
| TR-5 | The system must allow updating a ticket’s **Description** (FR-4). |
| TR-6 | The system must allow updating a ticket’s **Priority** (FR-4). |
| TR-7 | The system must allow updating a ticket’s **Assignee** (FR-4); the assignee can be changed (acceptance criteria). |
| TR-8 | The system must allow **adding comments** to a ticket (FR-5). |
| TR-9 | Each ticket has a **status** governed by the status state machine (see Section 5). |
| TR-10 | Tickets must be **searchable by keyword** (FR-6). |
| TR-11 | Tickets must be **filterable by status** (FR-7). |

The assignment does not specify additional ticket fields, comment editing/deletion, or ticket deletion.

## 5. Status Requirements

### 5.1 Status values and primary flow

Ticket status must follow this state machine:

```text
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

### 5.2 Additional valid transitions

The following transitions are also valid:

```text
OPEN → CANCELLED
IN_PROGRESS → CANCELLED
```

### 5.3 Valid transitions (summary)

| From | To |
|------|-----|
| OPEN | IN_PROGRESS |
| OPEN | CANCELLED |
| IN_PROGRESS | RESOLVED |
| IN_PROGRESS | CANCELLED |
| RESOLVED | CLOSED |

(Implicit: each step in the primary chain is a valid transition when applied in order: OPEN → IN_PROGRESS, IN_PROGRESS → RESOLVED, RESOLVED → CLOSED.)

### 5.4 Invalid transitions

**Invalid status transitions must be rejected by the backend.**

Examples of invalid transitions given in the assignment:

```text
CLOSED → OPEN
RESOLVED → OPEN
CANCELLED → OPEN
```

Any transition not defined as valid in Sections 5.1 and 5.2 must be treated as invalid unless the assignment explicitly allows it (it does not).

### 5.5 Related requirements

| ID | Requirement |
|----|-------------|
| SR-1 | **Valid status transitions** must succeed (acceptance criteria). |
| SR-2 | **Invalid status transitions** must be **rejected by the backend** (assignment and acceptance criteria). |
| SR-3 | **State-machine integration tests** must pass (acceptance criteria). |

The assignment does not define how status changes are triggered (e.g. dedicated action vs. field update); it requires that the state machine rules and backend rejection of invalid transitions are satisfied.

## 6. Validation Requirements

| ID | Requirement |
|----|-------------|
| VR-1 | The **backend** must **validate input** (FR-9). |
| VR-2 | **Backend validation** must work (acceptance criteria). |

The assignment does not specify individual validation rules (field lengths, allowed priority values, assignee format, etc.) beyond requiring backend validation.

## 7. Error Handling Requirements

| ID | Requirement |
|----|-------------|
| ER-1 | The **UI** must **display meaningful errors** (FR-10). |
| ER-2 | The **UI displays meaningful errors** (acceptance criteria). |
| ER-3 | The **backend** must **reject invalid status transitions** (see Section 5); this is a form of error handling for disallowed operations. |

The assignment does not specify error payload format, HTTP status codes, or localization.

## 8. Persistence Requirements

| ID | Requirement |
|----|-------------|
| PR-1 | **Persist ticket data in a database** (FR-8). |
| PR-2 | Use **PostgreSQL** or **H2** (application scope). |
| PR-3 | **Data survives application restart** (acceptance criteria). |

The assignment does not specify schema, migrations, or indexing.

## 9. Acceptance Criteria

The system must satisfy all of the following (traceable to the assignment):

| ID | Criterion |
|----|-----------|
| AC-1 | A ticket can be **created from the UI**. |
| AC-2 | **Tickets can be listed**. |
| AC-3 | **Ticket details can be viewed**. |
| AC-4 | **Ticket fields can be updated**. |
| AC-5 | The **assignee can be changed**. |
| AC-6 | **Comments can be added**. |
| AC-7 | **Ticket search works**. |
| AC-8 | **Status filtering works**. |
| AC-9 | **Valid status transitions work**. |
| AC-10 | **Invalid status transitions are rejected by the backend**. |
| AC-11 | **Data survives application restart**. |
| AC-12 | **Backend validation works**. |
| AC-13 | The **UI displays meaningful errors**. |
| AC-14 | **State-machine integration tests pass**. |
| AC-15 | **No secrets are committed to the repository**. |

## 10. Out of Scope

The following are **not** required by the assignment as stated. They must not be assumed as requirements unless added in a future specification:

- Authentication, authorization, roles, or permissions.
- User management beyond what is needed to represent an **Assignee** as a ticket field.
- Deleting tickets or deleting/editing comments.
- Ticket fields other than those listed for update (Title, Description, Priority, Assignee) and status behavior defined by the state machine.
- Defining allowed values for Priority, Assignee representation, or which attributes keyword search includes (assignment specifies search by keyword only).
- API endpoint design, request/response shapes, and database table design (not part of this requirements document).
- Workflows, notifications, attachments, SLA, reporting, or auditing beyond what is implied by the listed functional requirements.
- Technology choices outside those named in the assignment scope (Java 21, Spring Boot, PostgreSQL or H2, REST API, React/Next.js or equivalent frontend).

---

*Source: Spec-Driven Development assignment requirements as provided for the Support Ticket Management System. Requirements in this document are limited to that source.*
