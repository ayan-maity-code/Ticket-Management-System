# Java 21 & Spring Boot Development Guidelines

Reusable project-level guidelines for AI-assisted development on this Support Ticket Management System (Java 21, Spring Boot). Follow these rules when proposing or implementing changes.

---

## 1. Java 21 Usage

- Target **Java 21** language features and APIs supported by the project’s build configuration.
- Prefer modern, readable constructs where they improve clarity: `record` for immutable DTOs/value objects, `var` only when the type is obvious from context, pattern matching and `switch` expressions where they reduce boilerplate, `Optional` for explicit absence (not as fields on entities or method parameters by default).
- Use **try-with-resources** for closable resources; prefer **immutable** collections and defensive copies when exposing internal state.
- Avoid deprecated APIs; migrate away from legacy APIs when touching related code.
- Do not add complexity for the sake of “modern Java”—choose the simplest construct that remains maintainable.

---

## 2. Spring Boot Architecture

- Follow a **layered architecture**: presentation (web), application (services), domain (entities/models), infrastructure (persistence, external integrations).
- Keep **framework concerns** (HTTP, transactions, security filters) at the edges; keep **business rules** in the service layer.
- Use Spring Boot conventions: auto-configuration, `application.yml` / `application.properties`, profile-specific config (`application-dev.yml`, etc.).
- Introduce new modules or packages only when there is a clear boundary (e.g. shared kernel vs. feature area)—avoid premature modularization.

---

## 3. Controller, Service, and Repository Separation

| Layer        | Responsibility |
|-------------|--------------|
| **Controller** | Map HTTP to application operations; validate request shape; return appropriate status codes and response DTOs. No persistence or business rules. |
| **Service**    | Business logic, orchestration, transaction boundaries, authorization checks that depend on domain state. |
| **Repository** | Data access only (Spring Data JPA interfaces, custom queries). No HTTP or business workflow. |

- Controllers call services; services call repositories and other services—not the reverse.
- Do not access `EntityManager` or repositories directly from controllers.
- Do not return JPA entities from controllers unless the project explicitly standardizes on that pattern (default: use DTOs).

---

## 4. DTO Usage

- Use **DTOs** for REST request and response bodies unless an existing endpoint pattern differs—then match the project.
- Map between entities and DTOs in the service layer or dedicated mapper components; keep mapping logic out of controllers when possible.
- Do not expose JPA entities through public APIs: avoids leaking persistence details, lazy-loading issues, and unintended serialization of relations.
- Version or extend DTOs deliberately when API contracts change; avoid breaking clients without an explicit requirement.

---

## 5. Entity Design

- Design JPA entities with clear **relationships**, correct **cardinality**, and explicit **fetch** strategy (`LAZY` by default for collections and many-to-one where appropriate).
- Use **bidirectional** associations only when necessary; prefer unidirectional mappings when they suffice.
- Configure **cascade** and **orphanRemoval** carefully—only where the aggregate lifecycle requires it.
- Keep entities focused on **persistence state**; avoid HTTP, security, or orchestration logic in entities.
- Use appropriate identifiers (`@Id`, generation strategy), auditing fields (`createdAt`, `updatedAt`) if the project uses them, and indexes/constraints via migrations or DDL strategy consistent with the repo.
- Be mindful of **equals/hashCode** for entities (typically id-based or business-key-based per team convention).

---

## 6. Dependency Injection

- Prefer **constructor injection** for all required dependencies (`@RequiredArgsConstructor` on Lombok-enabled classes only if the project already uses Lombok consistently).
- Avoid **field injection** (`@Autowired` on fields).
- Keep dependency lists **small and explicit**; if a service has many dependencies, consider whether responsibilities should be split.
- Use interfaces for seams that are mocked in tests or swapped in infrastructure—do not over-abstract single implementations.

---

## 7. Exception Handling

- Define **meaningful domain or application exceptions** where they clarify flow (e.g. resource not found, conflict, forbidden operation).
- Centralize HTTP mapping with **`@ControllerAdvice`** (or `@RestControllerAdvice`) and consistent error response bodies (code, message, optional field errors, correlation id if used).
- Map exceptions to appropriate **HTTP status codes**; do not return 500 for expected business failures.
- **Never** expose stack traces, SQL, internal class names, or secrets in API error responses.
- Log exceptions at appropriate levels in the advice or service layer; include context (resource id, operation) without sensitive data.

---

## 8. Validation

- Validate incoming requests with **Jakarta Bean Validation** (`@Valid`, `@Validated`) on controller method parameters.
- Use constraints aligned with business rules: `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Past`/`@Future`, custom validators when needed.
- Keep validation annotations on **DTOs** (or dedicated command objects), not scattered as manual checks in controllers unless validation is inherently contextual in the service.
- Return **field-level** validation errors in a consistent structure when validation fails (typically 400 Bad Request).

---

## 9. Transaction Management

- Place **`@Transactional`** on **service** methods (class-level only when every public method should be transactional).
- Keep transactions **as short as practical**; avoid long-running work, external HTTP calls, or blocking I/O inside transactional methods when possible.
- Use **`readOnly = true`** for read-only service operations when beneficial.
- Understand **propagation** and **rollback**: default rollback on runtime exceptions; use `rollbackFor` / `noRollbackFor` only when required and documented.
- Do not nest transactions unnecessarily; avoid `@Transactional` on controllers or repositories unless the project has an established exception.

---

## 10. Naming Conventions

- Follow standard Java conventions: `PascalCase` types, `camelCase` methods/fields, `UPPER_SNAKE_CASE` constants.
- Suffix by role where helpful: `*Controller`, `*Service`, `*Repository`, `*Dto` / `*Request` / `*Response`, `*Exception`.
- Use **meaningful** names (`findOpenTicketsByAssignee` not `getData`); avoid unclear abbreviations.
- REST paths: plural nouns, kebab-case or lowercase consistent with existing APIs; align HTTP verbs with semantics (GET read, POST create, PUT/PATCH update, DELETE remove).

---

## 11. Package Structure

- Organize by **feature or layer** consistently with the existing codebase—inspect before adding new packages.
- Typical layouts (adapt to what exists):
  - `...config`, `...web` or `...controller`, `...service`, `...repository`, `...domain` or `...entity`, `...dto`, `...exception`, `...mapper`
- Keep related types together; avoid deep package hierarchies without benefit.
- Do not duplicate parallel structures (e.g. two `service` roots) without a documented reason.

---

## 12. Logging

- Use **SLF4J** (`private static final Logger log = LoggerFactory.getLogger(...)` or Lombok `@Slf4j` if already in use).
- Log **meaningful events**: request handling boundaries (at debug/trace if noisy), business failures, integration errors, startup/config issues.
- Use parameterized messages: `log.info("Ticket {} assigned to {}", ticketId, assigneeId)`.
- **Never** log passwords, tokens, API keys, full credit card numbers, or other secrets/PII beyond what policy allows.
- Avoid duplicate logging at every layer for the same failure; prefer logging once at the boundary or where the error is handled.

---

## 13. Configuration Management

- Externalize environment-specific settings in **`application.yml`** / properties and **profiles** (`dev`, `test`, `prod`).
- Use **`@ConfigurationProperties`** for grouped, typed configuration when the project uses that pattern.
- Sensitive values: **environment variables**, secret managers, or Spring Cloud Config—never source-controlled secrets.
- Do not hardcode URLs, credentials, or feature flags that differ per environment.
- Document new configuration keys in README or project docs when adding non-obvious settings.

---

## 14. Database Access with Spring Data JPA

- Use **Spring Data JPA** repository interfaces extending `JpaRepository` or project base types.
- Prefer **derived query methods** and **JPQL**; use **native queries** only when justified (performance, DB-specific features).
- Avoid **N+1** problems: fetch joins, `@EntityGraph`, or DTO projections where appropriate; verify with tests or query logging in dev.
- Use **`Pageable`** and **`Sort`** for list endpoints that may grow large; never unbounded `findAll()` in APIs unless explicitly required.
- Keep SQL/JPQL out of controllers; complex queries belong in repositories or dedicated query components.
- Align schema changes with the project’s migration tool (e.g. Flyway/Liquibase) if present—do not rely on `ddl-auto=update` in production-oriented workflows unless the project already does.

---

## 15. Business Logic

- **All business rules** live in the **service layer** (or domain services if the project uses DDD-style packages).
- Controllers are **thin**: parse input, call service, map to HTTP response.
- Centralize rules so they are **unit-testable** without MockMvc unless testing the web layer specifically.
- Do not duplicate the same rule in multiple controllers or repositories.

---

## 16. Clean and Maintainable Code

- Apply **SOLID** pragmatically: single responsibility per class, depend on abstractions where testing requires it.
- Prefer **simple, readable** code over clever abstractions or generic frameworks.
- Remove duplication by reusing existing utilities—do not create shared “util” dumping grounds.
- **Do not add dependencies** (libraries, starters) without clear need; match versions to the parent BOM or `gradle/libs.versions.toml` if used.
- **Preserve existing behavior** unless the task explicitly requires a behavior change.
- Match **formatting, imports, and patterns** of neighboring files.

---

## 17. Security Considerations

- Validate and sanitize **all external input**; never trust client-supplied ids or roles for authorization alone.
- Enforce **authentication and authorization** at the appropriate layer (Spring Security annotations, method security, or filter chain)—consistent with the project.
- Use **least privilege** for roles and service accounts.
- Avoid exposing internal IDs or implementation details when opaque tokens or UUIDs are the project standard.
- Protect against common issues: mass assignment (do not bind entity graphs blindly), injection (parameterized queries), and excessive data exposure in list endpoints.

---

## 18. Secrets and Sensitive Configuration

- **Never** hardcode passwords, API keys, tokens, database credentials, or encryption keys.
- **Never** commit secrets to git (including test credentials that mirror production patterns).
- Use environment variables, `.env` excluded from VCS, Kubernetes secrets, or approved secret managers.
- Rotate credentials if accidental exposure is suspected; do not log or echo secrets in error messages.

---

## AI-Assisted Development Rules

When modifying this codebase, AI assistants must work **safely, incrementally, and in context**—not by generating large unrelated implementations.

### Before changing code

1. **Inspect** the existing project structure, package layout, naming, and patterns.
2. **Read** related controllers, services, repositories, entities, DTOs, tests, and configuration for the area being changed.
3. **Identify** the smallest change that satisfies the requirement.

### While implementing

- **Reuse** existing patterns, base classes, mappers, exception types, and configuration.
- Make the **smallest necessary diff**; prefer targeted edits over rewriting whole files.
- **Do not** create new classes, methods, dependencies, or abstractions unless they are required for the task.
- **Do not** change unrelated code, reformat entire files, or “clean up” without request.
- **Do not** implement functionality that was not requested.
- Follow the project’s **existing style** (Lombok vs plain Java, record vs class DTOs, etc.).
- Before finalizing, verify **imports**, **dependencies**, **method signatures**, **entity relationships**, and **configuration** remain consistent.
- Consider **validation**, **exception handling**, **transactions**, **security**, and **database** impact of every change.

### When requirements are unclear

- **State assumptions explicitly** instead of inventing domain rules, ticket statuses, workflows, or integrations.
- Do not assume domain-specific requirements for the Support Ticket Management System beyond what is documented or requested.

### After implementing

- Prefer **incremental, reviewable** changes suitable for pull requests.
- **Recommend or add tests** for changed behavior when the project has tests; match existing test style (JUnit 5, Mockito, `@WebMvcTest`, `@DataJpaTest`, etc.).
- Note if tests were not run and what should be verified manually.

### Restrictions for guideline-only work

This document is a **development guideline only**. It does not prescribe specific ticket fields, statuses, or workflows unless defined elsewhere in the project.springboot

---

## Quick reference checklist

Before submitting a change, confirm:

- [ ] Layer boundaries respected (controller → service → repository)
- [ ] DTOs used for API surface; entities not leaked inappropriately
- [ ] Constructor injection; no new field injection
- [ ] Validation and exception handling consistent with `@ControllerAdvice`
- [ ] `@Transactional` only where needed on services
- [ ] No secrets in code or logs; config externalized
- [ ] Queries paginated where lists can grow; N+1 considered
- [ ] Smallest change; existing patterns preserved
- [ ] Tests updated or suggested for behavior changes
