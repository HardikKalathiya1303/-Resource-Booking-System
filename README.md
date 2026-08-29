# Resource Booking System

A booking system for shared resources (meeting rooms) built with **React/TypeScript**, **NestJS**, and **PostgreSQL**.

---

## How to Run

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 20+ (for running locally without Docker)

### Option A — Docker Compose (recommended)

```bash
docker-compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:3000  |
| Postgres | localhost:5432         |

Migrations and seed data run automatically on startup.

### Option B — Local development

**Postgres** (still needs Docker):
```bash
docker-compose up postgres
```

**Backend:**
```bash
cd backend
cp .env.example .env
npm install --legacy-peer-deps
npm run start:dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Running Tests

### Unit tests (no database needed)
```bash
cd backend
npm test
```
Covers: slot generation, DST spring-forward, DST fall-back, Kolkata UTC offset.

### Concurrent booking integration test (requires Postgres)
```bash
docker-compose up postgres   # in one terminal
cd backend
npm run test:e2e             # in another
```
Fires two simultaneous `POST /bookings` at the same slot and asserts exactly one succeeds (201) and one fails (409).

---

## How Double-Booking is Prevented

**Short answer:** a `UNIQUE` constraint on `(resource_id, start_at)` in PostgreSQL, enforced inside an explicit transaction with `SELECT … FOR UPDATE`.

**In detail:**

A plain SELECT-then-INSERT has a TOCTOU race: two concurrent requests can both pass the "is this slot free?" check before either has committed, and both insert successfully. That's a bug.

This system uses two layers:

1. **`SELECT … FOR UPDATE` (pessimistic lock)**  
   Inside a transaction, the service queries the booking row for that `(resource_id, start_at)`. If one exists, the row is locked — a second concurrent request blocks until the first transaction commits, then sees the row and returns 409 without attempting an INSERT.

2. **`UNIQUE (resource_id, start_at)` constraint**  
   Even if two requests arrive so simultaneously that both pass the `SELECT FOR UPDATE` before either commits, PostgreSQL allows only one `INSERT` to succeed. The loser gets error code `23505`, which the service maps to a clean `409 Conflict`.

The constraint is defined in migration `1002_create_bookings.ts` and is enforced by the database — not by application code.

---

## How Timezones and DST Are Handled

**Storage:** all booking times are stored as `TIMESTAMPTZ` (UTC) in PostgreSQL. Wall-clock times are never stored as if they were UTC.

**Library:** [Luxon](https://moment.github.io/luxon/) is used for all timezone conversions. No manual offset arithmetic.

**Slot generation:**
1. The requested date is interpreted in the **resource's own timezone** (e.g. `Europe/London`), not UTC. This ensures the correct calendar day and weekday are used.
2. Availability window boundaries (`"09:00"`, `"17:00"`) are parsed as wall-clock times in the resource's timezone using `DateTime.fromISO(date + 'T' + time, { zone: timezone })`, then converted to UTC.
3. Slots are walked in fixed **UTC minutes** — timezone offset changes mid-walk have no effect.

**DST spring-forward (e.g. London 2025-03-30, clocks jump 01:00 → 02:00):**  
After converting a local time to UTC, the system round-trips back to local time. If the times differ, the original was in the gap (Luxon silently shifted it) — the slot is skipped.

**DST fall-back (e.g. London 2025-10-26, clocks repeat 01:00):**  
Because the walk is in UTC, each step is a unique UTC instant. A `Set` of seen UTC strings deduplicates any repeat. No slot appears twice.

**Cross-timezone display:**  
The `GET /resources/:id/slots?timezone=` endpoint accepts the user's IANA timezone. Each slot in the response includes both `startLocal` (resource's timezone) and `startDisplay` (user's timezone), so a user in `Asia/Kolkata` booking a `Europe/London` room sees both their local time and the room's local time.

---

## Seed Data

Three resources are seeded automatically via migration:

| Resource | Timezone | DST | Hours |
|---|---|---|---|
| London Conference Room | `Europe/London` | ✅ GMT↔BST | Mon–Fri 09:00–17:00 |
| New York Meeting Pod | `America/New_York` | ✅ EST↔EDT | Mon–Fri 09:00–17:00 |
| Kolkata Workshop Space | `Asia/Kolkata` | ❌ Fixed +5:30 | Mon–Sat 10:00–18:00 |

---

## Slot Length

**60 minutes.** Defined per resource via `slotDurationMinutes` (defaulting to `60`). To change it, update the field in the seed migration and restart.

---

## Assumptions

- **No authentication.** A `userId` string is passed on each booking request. Any non-empty string is accepted.
- **No admin UI.** Resources are managed through seed migrations only.
- **Weekly recurrence only.** No per-day exceptions, holidays, or one-off overrides.
- **Half-open intervals.** A slot `[09:00, 10:00)` and `[10:00, 11:00)` are adjacent, not overlapping. The unique constraint is on `start_at`, which is sufficient.

---

## What I'd Do with More Time

- **Auth** — JWT-based auth so users can view their own bookings and cancel them.
- **Cancellation** — `DELETE /bookings/:id` with a cancellation window rule.
- **Per-resource slot length** — the entity already has `slotDurationMinutes`; the UI just needs a display for it.
- **Pagination and date-range view** — a week-view calendar instead of a single-day slot grid.
- **WebSocket or polling** — so the slot grid refreshes automatically when someone else books in the same session.
- **E2E tests for DST** — parameterised tests that hit the full stack on known spring-forward and fall-back dates.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Axios, Luxon |
| Backend | NestJS, TypeORM, class-validator |
| Database | PostgreSQL 16 (`TIMESTAMPTZ`, `JSONB`, `UNIQUE` constraint) |
| Dev tooling | Docker Compose, Jest, ts-jest, Supertest |
