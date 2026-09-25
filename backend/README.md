# Support Ticket Backend

Requires **Java 21** and **Gradle 8.5+** (Gradle 7.x cannot run this project on Java 21).

## Run locally (recommended)

Use the **Gradle Wrapper** (Gradle 8.11.1) — do **not** use the system `gradle` command if it is 7.x:

```bash
cd backend
./gradlew bootRun
```

First run downloads Gradle 8.11.1 automatically.

## If `./gradlew` is missing or fails

Install Gradle 8.11+ once, then generate the wrapper:

```bash
# Example with SDKMAN
sdk install gradle 8.11.1
sdk use gradle 8.11.1
gradle wrapper --gradle-version 8.11.1
./gradlew bootRun
```

Or run without wrapper (Gradle 8.11+ only):

```bash
gradle bootRun
```

## Database

File-based **H2** by default (`backend/data/`). Optional env: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

Run **one** backend instance per database file.

### H2 error: `Database may be already in use` (90020)

Another `bootRun` (or IDE run) still has the database open.

```bash
chmod +x scripts/stop-backend.sh
./scripts/stop-backend.sh
./gradlew bootRun
```

Or manually:

```bash
pkill -f BackendApplication
# optional stale lock files only if no Java process is running:
rm -f data/support_ticket.lock.db
```

Do **not** delete `support_ticket.mv.db` unless you intend to wipe ticket data.

## Tests

```bash
./gradlew test
```
