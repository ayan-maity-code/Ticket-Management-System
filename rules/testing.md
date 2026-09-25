# Testing Guidelines

Reusable project-level testing standards for AI-assisted development on this Support Ticket Management System (Java 21, Spring Boot). Follow these rules when creating or modifying tests.

---

## 1. JUnit 5

- Use **JUnit 5** (Jupiter) as the primary testing framework.
- Prefer modern annotations: `@Test`, `@ParameterizedTest`, `@BeforeEach`, `@AfterEach`, `@DisplayName`, `@Nested` for grouping related cases.
- Use **AssertJ** or JUnit assertions consistently with the existing test suite—do not mix styles unnecessarily within one module.
- Keep tests **deterministic**: no reliance on wall-clock timing, randomness without fixed seeds, or execution order.
- Avoid JUnit 4 APIs (`@RunWith`, `@Rule` unless bridged intentionally), deprecated Jupiter features, and redundant `@ExtendWith` when Spring Boot test slices already provide the context.
- One logical behavior per test method; use `@Nested` or separate classes when a feature has many scenarios.

---

## 2. Unit Testing

- Unit-test **individual components in isolation** when the goal is to verify logic without Spring context or a real database.
- Assert **observable outcomes**: return values, thrown exceptions, state changes on objects under test—not private method calls or internal fields unless they are the contract.
- Prioritize coverage for **business rules**, branching, and error paths that matter to users and maintainers.
- Do not unit-test framework behavior (Spring, Hibernate, Jackson) or trivial accessors unless they encode non-trivial logic (e.g. computed fields, validation in a setter).

---

## 3. Service-Layer Testing

- **Prioritize** service-layer tests for business logic, orchestration, and transaction-related behavior (with mocks for repositories and external clients).
- Cover **success paths** and **failure paths**: not found, conflict, invalid state, authorization denials when enforced in the service.
- Use **`verify()`** on mocks only when collaboration with a dependency is part of the specified behavior (e.g. must not call persist when validation fails).
- Keep services testable **without** HTTP or MVC: no `MockMvc` in pure service unit tests.
- When a service is thin delegation only, avoid duplicating repository integration tests at the service level—test where value is highest.

---

## 4. Controller / API Testing

- Use **`@WebMvcTest`** (or project equivalent) to test REST **HTTP contract**: status codes, response body shape, content type, validation errors.
- Verify **request validation** (`@Valid`): missing fields, blank values, invalid formats—aligned with DTO constraints and API spec.
- Cover **security-related responses** (401, 403) when the endpoint is protected and the project defines those behaviors.
- **Mock the service layer** in slice tests; assert the controller maps inputs/outputs correctly—do not re-assert every business rule already covered in service tests.
- Include **malformed JSON**, unsupported methods, and not-found routes only when relevant to the change or existing patterns.

---

## 5. Repository and Integration Testing

- Use **`@DataJpaTest`**, **`@SpringBootTest`**, or focused integration tests when verifying **persistence**, queries, constraints, or multi-component wiring.
- Prefer an **in-memory or test database** (H2, Testcontainers) consistent with the project—do not mock `EntityManager` when query correctness is under test.
- Verify **derived/custom queries**, **pagination**, **sorting**, **filters**, **unique constraints**, and **relationship mappings** that affect behavior.
- Use **test slices** to avoid loading the full application when a narrower context suffices.
- Keep integration tests **focused**: one concern per test class or nested group when possible.

---

## 6. Mockito

- Use **Mockito** (`@Mock`, `@InjectMocks`, `@ExtendWith(MockitoExtension.class)` or Spring’s `@MockBean` in slice tests) for dependencies outside the unit under test.
- **Never mock** the class whose behavior is being verified.
- Prefer **`when(...).thenReturn(...)`** for stubbing; use **`verify`** sparingly and with clear intent.
- Avoid **argument captors** unless asserting passed values is essential to the scenario.
- Do not mock **DTOs, records, enums, or plain data**—construct real instances.
- Match Mockito usage to existing tests (e.g. `@MockBean` vs manual `@Mock`).

---

## 7. When Mocks Should and Should Not Be Used

### Use mocks when

| Situation |
|-----------|
| Testing a unit in isolation |
| Dependency is outside the behavior under test (repository, mail client, clock) |
| Real dependency is slow, flaky, or unavailable in unit tests |
| Test must simulate specific failure or edge responses from a dependency |

### Avoid mocks when

| Situation |
|-----------|
| Verifying SQL/JPQL, indexes, or entity lifecycle |
| Proving wiring between real Spring components |
| Implementation is lightweight and deterministic (e.g. mapper with no I/O) |
| Mocking would let the test pass without exercising the behavior under investigation |
| Heavy mocking obscures the scenario under test |

Choose the **test type** (unit vs slice vs integration) first; then decide what to mock.

---

## 8. Test Naming Conventions

- Names should describe **scenario + expected outcome**.
- Prefer: `shouldCreateTicketWhenRequestIsValid`, `shouldRejectTicketCreationWhenTitleIsBlank`, `shouldThrowExceptionWhenTicketDoesNotExist`.
- Use `@DisplayName` for readable sentences when method names would be unwieldy—match project convention.
- Avoid: `testCreate`, `testService`, `testCase1`, `happyPath`.
- Failed test output should point to **what broke** without opening production code first.

---

## 9. Arrange / Act / Assert

Structure tests with clear **AAA** sections (blank line between sections is enough):

1. **Arrange** — inputs, entities, mock stubs, security context, clock.
2. **Act** — single call to the method or HTTP request under test.
3. **Assert** — outcomes, exceptions, HTTP response, persisted state.

- Avoid large arrange blocks shared across unrelated tests—extract **fixtures/builders** instead.
- Do not combine multiple unrelated acts in one test unless testing a single documented workflow end-to-end.

---

## 10. Positive and Negative Test Cases

For important functionality, include both:

**Positive**

- Valid input and successful operations
- Allowed state transitions (per spec)
- Expected HTTP status and response body
- Correct persistence when integration is in scope

**Negative**

- Invalid or incomplete input
- Missing resources
- Forbidden or unauthorized access (when applicable)
- Disallowed state transitions
- Duplicates and conflicts
- Expected exceptions and API error payloads

Do not ship features with **happy-path-only** tests when failure modes are part of the contract.

---

## 11. Validation Testing

- Test validation that is part of the **API or domain contract** (Bean Validation on DTOs, custom validators).
- Examples: required fields, null/blank, format, `@Size` min/max, numeric ranges, invalid field combinations.
- Assert **HTTP 400** (or project standard) and **field error structure** for web layer tests; assert exception or result type for service-level validation if not duplicated at web layer.
- Do not add tests for constraints that **do not exist** in code or specification—read annotations and requirements first.

---

## 12. Exception Testing

- Use `assertThrows` (JUnit) or AssertJ `assertThatThrownBy` for expected failures.
- Assert **exception type** and, when part of the contract, **message code**, error enum, or HTTP problem detail fields—not full stack traces or internal messages.
- Ensure tests prove failures are **not swallowed** (state unchanged, no partial persist).
- Cover **domain/application exceptions** mapped by `@ControllerAdvice` in API tests where appropriate.
- Avoid asserting private fields inside exception classes unless they are the public API.

---

## 13. State-Machine Transition Testing

When the specification defines **ticket (or workflow) status** as a state machine:

- **Allowed** transitions succeed and leave the entity in the expected status.
- **Disallowed** transitions are rejected with the documented exception or HTTP error.
- After a rejected transition, **status and related fields remain unchanged** (unless spec says otherwise).
- Enforce **preconditions** per transition (assignee required, resolution notes, etc.) only as defined in spec or code.
- Do **not** invent transitions or statuses; read enums, docs, and existing tests first.

---

## 14. Integration Testing for Ticket Status Transitions

When transitions cross **service + persistence** (and optionally web):

- Use integration tests to confirm **end-to-end** valid transitions persist correctly.
- Confirm **invalid** transitions do not commit a new status (rollback or no save).
- After failed operations, **reload from database** (or use `@Transactional` rollback semantics consciously) to assert persisted state.
- Verify **transaction boundaries** when a transition triggers multiple writes—match project transaction configuration.
- Align scenarios with **actual** transition rules in the codebase and specification.

---

## 15. Edge Cases

Test edge cases that are **specified or realistically likely**, such as:

- Null/empty strings and empty collections where allowed or forbidden
- Boundary lengths and numeric limits
- Non-existent IDs (404 or domain not-found)
- Duplicate create or duplicate transition requests
- Idempotent repeat of the same valid transition (if defined)
- Empty search/list results and **pagination** (first page, last page, page size zero if invalid)
- Large page requests only if the API defines limits

Skip speculative edge cases with no product or technical requirement.

---

## 16. Avoid Meaningless Tests

Do not add tests solely to raise **coverage metrics**.

Avoid tests that:

- Only assert getters/setters with no logic
- Mirror implementation line-by-line (testing private methods via reflection)
- Duplicate another test with no new scenario
- Mock all collaborators so nothing real is exercised
- `verify(mock)` every call without behavioral assertion
- Assert constants or framework defaults

Every test should answer: **what regression or requirement does this protect?**

---

## 17. Test Independence

- Tests must pass in **any order** and in parallel when the build enables it.
- No shared **mutable static** state between tests.
- Use `@BeforeEach` / `@AfterEach` or `@Sql` / `@DirtiesContext` per project patterns to reset data.
- Integration tests must not depend on data left by another test class.
- Use fixed clocks, IDs, or seeds for reproducibility.
- External services: stub, Testcontainers, or WireMock—never production endpoints.

---

## 18. Test Data

- Use **minimal, readable** data named for the scenario (`ticketWithOpenStatus`, `invalidCreateRequestMissingTitle`).
- Prefer **builders, factory methods, or `@ClasspathSource` JSON** already in the project over copy-pasted blobs.
- Centralize repeated fixtures in test support packages when multiple classes need them—do not duplicate large setups.
- **Never** use production credentials, PII, or secrets in tests or committed fixture files.

---

## 19. AI-Assisted Testing Rules

AI assistants must base tests on **specification, existing behavior, and current implementation**—not invented domain rules.

### Before writing or changing tests

1. Inspect **package layout** (`src/test/java`, resources, `application-test.yml`).
2. Read **production code** under test and **neighbor tests** for patterns.
3. Note testing stack: JUnit 5, Mockito, AssertJ, Spring Boot test slices, Testcontainers, security test helpers.
4. Derive expected behavior from **code + docs + tickets**; list success and failure scenarios.
5. Reuse **fixtures, `@Import`, test configuration, and `@WithMockUser`** (or project equivalents).

### While writing tests

- Add only tests **relevant to the requested change**; keep each test small and focused.
- **Preserve** existing tests unless behavior intentionally changed or a test is wrong.
- Do not **rewrite** entire suites or duplicate coverage across layers without reason.
- Do not **guess** statuses, transitions, or error codes—state ambiguity and ask or align with code.
- Choose **unit vs integration** based on what must be proven; mock deliberately, not by default.
- For bug fixes, add a test that **would have failed** before the fix when practical.
- Ensure new tests are **deterministic** and **independent**.

### Restrictions

- Do not implement production features while “adding tests.”
- Do not assume ticket workflow details absent from spec or code.

---

## 20. Safe Test Modification

When changing an existing test:

1. Read the test and the **production code** it protects.
2. Understand **why** the test exists (regression, spec clause, layer contract).
3. Make the **smallest** change: update assertions, data, or mocks only as needed.
4. Leave **unrelated** tests and scenarios untouched.
5. Check **related layers** (service test updated vs controller test) for consistency with the change.
6. Do not change production code **only** to satisfy a test unless the task requires a behavior fix.
7. Confirm updated tests still match the **authoritative specification** after the change.

---

## Quick reference checklist

Before submitting test changes, confirm:

- [ ] JUnit 5 and project assertion/Mockito style followed
- [ ] Right test type: unit (isolated logic) vs slice (web/JPA) vs integration
- [ ] Descriptive names; AAA structure; positive and negative cases where it matters
- [ ] Mocks used appropriately; database not mocked when queries are under test
- [ ] Validation and exception assertions match API contract
- [ ] Status transitions (if applicable) match spec—no invented rules
- [ ] Tests independent, deterministic, no secrets in data
- [ ] No duplicate or meaningless coverage; smallest focused diff
- [ ] Existing tests preserved unless intentionally obsolete

---

## Relationship to other guidelines

Apply **`rules/java-springboot.md`** for production code structure (layers, DTOs, transactions, security). Tests should reflect those boundaries: business rules primarily in service tests, HTTP contract in controller tests, persistence in repository/integration tests.
