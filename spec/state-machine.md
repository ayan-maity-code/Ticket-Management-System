# Support Ticket Management System — State Machine Specification

This document defines **only** the ticket **status state machine**. It is derived from [`spec/requirements.md`](requirements.md), with enforcement and persistence context from [`spec/architecture.md`](architecture.md) and [`spec/data-model.md`](data-model.md).

No implementation code, API URLs, or tests appear in this specification.

---

## 1. Purpose

Support tickets move through a fixed set of **status** values over their lifetime. A **state machine** defines which changes from one status to another are **allowed**. The application must allow only **valid** transitions and **reject** all others so that stored ticket status always reflects the rules in [`spec/requirements.md`](requirements.md) Section 5 (SR-1, SR-2, AC-9, AC-10).

---

## 2. States

The system has **exactly five** statuses. No other status values exist.

| Status | Description (logical) |
|--------|------------------------|
| `OPEN` | Ticket exists and work has not started on the primary resolution path. |
| `IN_PROGRESS` | Ticket is actively being worked. |
| `RESOLVED` | Work is complete; ticket awaits closure. |
| `CLOSED` | Ticket is closed on the primary path. |
| `CANCELLED` | Ticket is cancelled instead of completed on the primary path. |

---

## 3. Initial State

Every **newly created** ticket must have status **`OPEN`**.

**Rationale (requirements):** The defined primary lifecycle begins at `OPEN` (`OPEN → IN_PROGRESS → RESOLVED → CLOSED`). Valid transitions **from** `OPEN` are only to `IN_PROGRESS` and `CANCELLED`. No valid transition **to** `OPEN` exists (e.g. `CLOSED → OPEN` is invalid). Therefore creation enters the machine at `OPEN`.

Creation itself is not a transition from another status; it establishes the first stored status as `OPEN` ([`spec/data-model.md`](data-model.md) `Ticket.status`).

---

## 4. Valid Transitions

**Only** the following transitions are valid. Each row is an allowed change from **current** status to **new** status in a single request.

| # | From | To |
|---|------|-----|
| 1 | `OPEN` | `IN_PROGRESS` |
| 2 | `OPEN` | `CANCELLED` |
| 3 | `IN_PROGRESS` | `RESOLVED` |
| 4 | `IN_PROGRESS` | `CANCELLED` |
| 5 | `RESOLVED` | `CLOSED` |

Equivalent list:

```text
OPEN → IN_PROGRESS
OPEN → CANCELLED
IN_PROGRESS → RESOLVED
IN_PROGRESS → CANCELLED
RESOLVED → CLOSED
```

**Rule:** If a requested pair `(from, to)` is not in this list (and `from` ≠ `to`), the transition is **invalid**. Same-status requests (`from` = `to`) are not listed as valid transitions; treat as no-op or invalid per implementation policy, but must not violate persistence rules in Section 8.

### 4.1 Complete transition matrix

Rows = current status, columns = requested new status. **Y** = valid, **N** = invalid.

| From \ To | OPEN | IN_PROGRESS | RESOLVED | CLOSED | CANCELLED |
|-----------|------|-------------|----------|--------|-----------|
| **OPEN** | N | Y | N | N | Y |
| **IN_PROGRESS** | N | N | Y | N | Y |
| **RESOLVED** | N | N | N | Y | N |
| **CLOSED** | N | N | N | N | N |
| **CANCELLED** | N | N | N | N | N |

---

## 5. Invalid Transitions

Any transition **not** marked **Y** in Section 4.1 is **invalid** and must be **rejected by the backend** (SR-2, AC-10).

**Examples (invalid):**

```text
CLOSED → OPEN
RESOLVED → OPEN
CANCELLED → OPEN
OPEN → RESOLVED
IN_PROGRESS → CLOSED
OPEN → CLOSED
RESOLVED → CANCELLED
CLOSED → CANCELLED
```

No additional transitions beyond Section 4 are valid.

---

## 6. Terminal States

From the transition matrix, a **terminal state** is one with **no valid outgoing transition** (no **Y** in its row except none apply).

| State | Outgoing valid transitions | Terminal? |
|-------|----------------------------|-----------|
| `OPEN` | → `IN_PROGRESS`, → `CANCELLED` | No |
| `IN_PROGRESS` | → `RESOLVED`, → `CANCELLED` | No |
| `RESOLVED` | → `CLOSED` | No |
| `CLOSED` | (none) | **Yes** |
| `CANCELLED` | (none) | **Yes** |

**Terminal states:** `CLOSED` and `CANCELLED`.

Any status change request when the current status is `CLOSED` or `CANCELLED` must be rejected (unless implementation treats same-status as no-op without persisting a change).

---

## 7. Backend Enforcement

Per [`spec/architecture.md`](architecture.md):

- The **service layer** (optionally with a dedicated state-machine component) is the **authoritative** enforcement point.
- On each status change request: load **current** status from persistence, evaluate `(current, requested)` against Section 4, then either persist the new status or reject.
- The **frontend** may hide or disable actions for usability but **must not** replace backend validation (SR-2).
- Repositories store status; they do **not** decide validity.

---

## 8. Invalid Transition Behavior

When an **invalid** transition is requested:

| Requirement | Behavior |
|-------------|----------|
| Current status unchanged | The persisted `Ticket.status` must remain the value loaded before the request. |
| No invalid persist | The requested status must **not** be written to the database. |
| Client error | The backend returns an **appropriate client error** (4xx class; exact code is implementation detail per architecture). |
| UI feedback | The frontend displays a **meaningful error message** (FR-10, ER-1, AC-13). |

Valid transitions must persist the new status within the same transaction rules as other ticket updates ([`spec/architecture.md`](architecture.md)).

---

## 9. Transition Examples

### Valid

```text
OPEN → IN_PROGRESS
IN_PROGRESS → RESOLVED
RESOLVED → CLOSED
OPEN → CANCELLED
IN_PROGRESS → CANCELLED
```

### Invalid

```text
CLOSED → OPEN
RESOLVED → OPEN
CANCELLED → OPEN
OPEN → CLOSED
```

---

## 10. Testing Requirements

The state machine must be verified by tests (AC-14). This section defines **what** must be covered, not test code.

| Area | Required coverage |
|------|-------------------|
| **Valid transitions** | Each of the five transitions in Section 4 succeeds and persists the target status. |
| **Invalid transitions** | Representative invalid pairs (including Section 5 examples) are rejected. |
| **Terminal states** | Requests to leave `CLOSED` or `CANCELLED` for any other status are rejected. |
| **Persistence on invalid** | After rejection, loaded status still equals pre-request status. |
| **Persistence on valid** | After success, loaded status equals the requested valid target. |

Recommended placement per architecture: **unit tests** on transition logic (all matrix cells) plus **state-machine integration tests** with real persistence (AC-14).

---

## Traceability

| Topic | Source |
|-------|--------|
| Five statuses, valid/invalid transitions | `spec/requirements.md` §5 |
| Backend rejection, integration tests | SR-2, SR-3, AC-9, AC-10, AC-14 |
| `status` field, no DB transition rules | `spec/data-model.md` §4 |
| Service-layer enforcement | `spec/architecture.md` §6 |

---

*This specification is complete for ticket status behavior. API shapes and implementation types are out of scope.*
