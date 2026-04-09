# EKZ M&E System — Backend Implementation Plan

**Stack:** NestJS 11 · TypeORM · PostgreSQL 15 · JWT  
**Reference:** See `BACKEND_CONTEXT.md` for the full API contract, schema DDL, and business logic rules.  
**Goal:** Replace the Next.js frontend's MSW mocks with a real API reachable at `http://localhost:3000`.

---

## How to use this document

Work through phases in order. Each phase is self-contained and ends with a working, testable state. Do not skip ahead — later phases depend on the entities and guards established earlier.

Within each phase, tasks are numbered. Complete them in order.

---

## Phase 0 — Project Setup

> **Goal:** A running NestJS app connected to PostgreSQL, with all shared infrastructure in place. No business logic yet.

### 0.1 Install dependencies

```bash
pnpm add @nestjs/typeorm typeorm pg \
         @nestjs/jwt @nestjs/passport passport passport-jwt \
         class-validator class-transformer \
         bcrypt uuid \
         @nestjs/config

pnpm add -D @types/passport-jwt @types/bcrypt @types/uuid
```

### 0.2 Environment configuration

Create `.env` at the project root (never commit this file):

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ekz_me
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=8h
PORT=3000
CORS_ORIGINS=http://localhost:3001
```

Wire `@nestjs/config` in `AppModule` with `isGlobal: true` so every module can inject `ConfigService` without re-importing.

### 0.3 Database connection

Configure `TypeOrmModule.forRootAsync` in `AppModule`:

- `type: 'postgres'`
- Parse `DATABASE_URL` from `ConfigService`
- `entities: [__dirname + '/**/*.entity{.ts,.js}']`
- `migrations: [__dirname + '/migrations/*{.ts,.js}']`
- `synchronize: false` — always use migrations, never auto-sync
- `migrationsRun: true` — run pending migrations on startup

Enable the `uuid-ossp` PostgreSQL extension via the first migration (see 0.5).

### 0.4 `main.ts` global configuration

```typescript
app.setGlobalPrefix('api');

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));

app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3001'],
  credentials: true,
});

await app.listen(process.env.PORT ?? 3000);
```

### 0.5 Migrations setup

Configure the TypeORM CLI in `package.json` scripts:

```json
"migration:generate": "typeorm migration:generate -d dist/data-source.js",
"migration:run":      "typeorm migration:run -d dist/data-source.js",
"migration:revert":   "typeorm migration:revert -d dist/data-source.js"
```

Create `src/data-source.ts` exporting a `DataSource` instance (used by the CLI).

Write and run the first migration:
- Enable extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### 0.6 Global error response shape

Create an exception filter (`HttpExceptionFilter`) that catches all `HttpException` instances and formats every error response as:

```json
{ "message": "...", "errors": { "field": ["message"] } }
```

Apply it globally with `app.useGlobalFilters(...)`.  
The `errors` field is only present when the exception carries field-level detail (e.g., from `ValidationPipe`).

### 0.7 Clean up boilerplate

Remove `AppController`, `AppService`, and their spec files — they are not needed.

### 0.8 Verify

`pnpm start:dev` should start without errors and connect to PostgreSQL.

---

## Phase 1 — Authentication & Guards

> **Goal:** `POST /api/auth/login` and `GET /api/auth/me` working. JWT guard and RolesGuard protecting all future routes.

### 1.1 `users` entity & migration

Create `src/users/user.entity.ts`:

```
id           UUID PK DEFAULT uuid_generate_v4()
email        VARCHAR(255) UNIQUE NOT NULL
name         VARCHAR(255) NOT NULL
password_hash VARCHAR(255) NOT NULL
role         VARCHAR(50) NOT NULL  CHECK IN ('admin','me_staff','programme_staff','viewer')
avatar       TEXT nullable
active       BOOLEAN DEFAULT true
last_login   TIMESTAMPTZ nullable
created_at   TIMESTAMPTZ DEFAULT NOW()
updated_at   TIMESTAMPTZ DEFAULT NOW()
```

TypeORM entity decorators: `@Entity('users')`, `@PrimaryGeneratedColumn('uuid')`, `@Column`, `@CreateDateColumn`, `@UpdateDateColumn`.

Generate and run the migration.

### 1.2 `UsersModule` & `UsersService`

- `UsersService.findByEmail(email)` — used by auth
- `UsersService.findById(id)` — used by JWT strategy
- Never return `password_hash` from any public method; use a DTO or a `classTransformer` `@Exclude()` decorator

### 1.3 JWT strategy

`src/auth/jwt.strategy.ts`:

```typescript
// JWT payload:
interface JwtPayload {
  sub: string;   // user UUID
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

- Algorithm: HS256
- Secret: `JWT_SECRET` from `ConfigService`
- `validate()` returns `{ id, email, role }` — **do not** re-query the DB on every request; trust the payload

### 1.4 `JwtAuthGuard`

`src/auth/jwt-auth.guard.ts`:
- Extends `AuthGuard('jwt')`
- Checks for a `@Public()` metadata marker; if present, bypasses the guard
- Apply globally via `APP_GUARD` provider in `AuthModule`

### 1.5 `@Public()` decorator

`src/auth/public.decorator.ts` — sets metadata `IS_PUBLIC_KEY = true`.

### 1.6 `RolesGuard`

`src/auth/roles.guard.ts`:
- Reads `@Roles(...roles)` metadata
- Compares `request.user.role` against the allowed roles
- Returns `403` if the role is not permitted
- Apply globally via `APP_GUARD` provider (after `JwtAuthGuard`)

### 1.7 `@Roles()` decorator

`src/auth/roles.decorator.ts` — sets metadata with a list of `UserRole` values.

### 1.8 `UserRole` enum

`src/common/enums/user-role.enum.ts`:

```typescript
export enum UserRole {
  ADMIN = 'admin',
  ME_STAFF = 'me_staff',
  PROGRAMME_STAFF = 'programme_staff',
  VIEWER = 'viewer',
}
```

### 1.9 `AuthService`

- `login(email, password)`:
  1. Find user by email → `401` if not found
  2. `bcrypt.compare(password, user.password_hash)` → `401` if mismatch
  3. Check `user.active === true` → `401` if deactivated
  4. Update `user.last_login = NOW()`
  5. Sign and return JWT with `{ sub: user.id, email: user.email, role: user.role }`
  6. Return `{ user: { id, email, name, role, avatar }, token }`

### 1.10 `AuthController`

```
POST /api/auth/login    @Public()   — calls AuthService.login()
GET  /api/auth/me       Auth: all   — returns { user: req.user } (from JWT)
```

Response shapes must match `BACKEND_CONTEXT.md §6.1` exactly.

### 1.11 Seed script

`src/database/seeds/seed.ts` — a standalone Node script (not a NestJS command):

1. Connect to PostgreSQL via TypeORM
2. Check if `admin@ekz.com` already exists; skip if so
3. Insert one user per role:
   - `admin@ekz.com` / `Admin123!` / role `admin`
   - `me@ekz.com` / `Staff123!` / role `me_staff`
   - `prog@ekz.com` / `Staff123!` / role `programme_staff`
   - `viewer@ekz.com` / `Staff123!` / role `viewer`
4. Hash passwords with `bcrypt`, rounds = 10

Add `"seed": "ts-node src/database/seeds/seed.ts"` to `package.json` scripts.

### 1.12 Verify

- `POST /api/auth/login` with seeded credentials returns a JWT
- `GET /api/auth/me` with that token returns the user
- `GET /api/auth/me` without a token returns `401`
- A route decorated `@Roles(UserRole.ADMIN)` returns `403` when called with a `me_staff` token

---

## Phase 2 — Logframe & Indicators

> **Goal:** Full CRUD for logframe nodes (with tree builder) and indicators (with progress tracking).

### 2.1 `logframe_nodes` entity & migration

```
id           UUID PK DEFAULT uuid_generate_v4()
logframe_id  VARCHAR(50) DEFAULT 'lf_1'
type         VARCHAR(20) CHECK IN ('goal','outcome','output','activity')
code         VARCHAR(50) NOT NULL
title        TEXT NOT NULL
description  TEXT nullable
parent_id    UUID nullable FK → logframe_nodes(id) ON DELETE RESTRICT
order        INTEGER DEFAULT 0
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ
```

Self-referential relation: `@ManyToOne(() => LogframeNode, n => n.children)` and `@OneToMany(() => LogframeNode, n => n.parent)`.

### 2.2 `LogframeService`

**Tree builder** — `getTree()`:
1. Fetch all nodes with `relations: ['indicators']`
2. Build an in-memory map `id → node`
3. Attach children to their parent
4. Return only root nodes (where `parent_id` is null)

**Parent type constraint** — enforce before any insert or update:

| node type | required parent type |
|---|---|
| `goal` | `null` (no parent) |
| `outcome` | `goal` |
| `output` | `outcome` |
| `activity` | `output` |

Throw `BadRequestException` with a clear message on violation.

**Delete constraint** — throw `BadRequestException` if the node has children.

### 2.3 `LogframeController`

```
GET    /api/logframe                        Auth: all    → tree
POST   /api/logframe/nodes                  Auth: admin, me_staff
PUT    /api/logframe/nodes/:id              Auth: admin, me_staff
DELETE /api/logframe/nodes/:id              Auth: admin, me_staff
POST   /api/logframe/nodes/:id/indicators   Auth: admin, me_staff
DELETE /api/logframe/nodes/:nodeId/indicators/:indicatorId  Auth: admin, me_staff
```

Response shapes per `BACKEND_CONTEXT.md §6.2`.

### 2.4 `indicators` entity & migration

```
id                 UUID PK
code               VARCHAR(50) UNIQUE NOT NULL
name               VARCHAR(500) NOT NULL
description        TEXT NOT NULL
level              VARCHAR(20) CHECK IN ('impact','outcome','output')
unit               VARCHAR(100) NOT NULL
baseline           NUMERIC DEFAULT 0
target             NUMERIC NOT NULL
current_value      NUMERIC DEFAULT 0
status             VARCHAR(20) CHECK IN ('on_track','at_risk','off_track')
frequency          VARCHAR(20) CHECK IN ('monthly','quarterly','bi_annually','annually')
logframe_level_id  UUID nullable FK → logframe_nodes(id) ON DELETE SET NULL
sdg_ids            INTEGER[] DEFAULT '{}'
responsible_party  VARCHAR(255) NOT NULL
means_of_verification TEXT NOT NULL
created_at         TIMESTAMPTZ
updated_at         TIMESTAMPTZ
```

### 2.5 Status computation helper

`src/indicators/helpers/compute-status.ts`:

```typescript
export function computeStatus(currentValue: number, target: number): string {
  if (target === 0) return 'off_track';
  const ratio = currentValue / target;
  if (ratio >= 0.90) return 'on_track';
  if (ratio >= 0.60) return 'at_risk';
  return 'off_track';
}
```

Call this helper whenever `current_value` or `target` is set or updated.

### 2.6 `indicator_progress` entity & migration

```
id            UUID PK
indicator_id  UUID NOT NULL FK → indicators(id) ON DELETE CASCADE
value         NUMERIC NOT NULL
date          TIMESTAMPTZ NOT NULL
notes         TEXT nullable
submitted_by  VARCHAR(255) NOT NULL  ← display name string, not a FK
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### 2.7 `IndicatorsService`

- `findAll(filters)` — support query params: `status`, `logframe_level_id`, `sdg_id`, `frequency`, `search`, `page`, `per_page`
- `findOne(id)` — `404` if not found
- `create(dto)` — set `current_value = baseline`, compute `status`, persist
- `update(id, dto)` — partial update; recompute `status` if `current_value` or `target` changes; refresh `updatedAt`
- `remove(id)` — `admin` only; return `409` if indicator has linked submissions (check submissions table)
- `getProgress(id, from?, to?)` — return array of `indicator_progress` oldest-first

### 2.8 `IndicatorsController`

```
GET    /api/indicators              Auth: all
GET    /api/indicators/:id          Auth: all
GET    /api/indicators/:id/progress Auth: all  (query: from, to)
POST   /api/indicators              Auth: admin, me_staff
PUT    /api/indicators/:id          Auth: admin, me_staff
DELETE /api/indicators/:id          Auth: admin only
```

**Serialisation note:** Response timestamps must be `createdAt` / `updatedAt` (camelCase). Use a DTO class with `@Expose()` + `@Transform()`, or map in the service. See `BACKEND_CONTEXT.md §6.3`.

Progress response field names: `indicatorId` (camelCase), `submittedBy` (camelCase).

### 2.9 Logframe ↔ Indicator link

`logframe_nodes` holds a `@ManyToMany` or tracked UUID array relationship to indicators. Two options:

**Option A (recommended):** Add a `logframe_level_id` FK on `indicators` (already in schema). The `POST /api/logframe/nodes/:id/indicators` endpoint sets `indicator.logframe_level_id = nodeId`. `DELETE` clears it.

**Option B:** A join table `logframe_node_indicators(node_id, indicator_id)`. More flexible but adds complexity.

Use Option A unless the frontend shows an indicator linked to multiple nodes.

### 2.10 Verify

- `GET /api/logframe` returns a nested tree (not a flat list)
- Creating an `outcome` node without a `goal` parent returns `400`
- Creating an indicator sets `current_value = baseline` and correct `status`
- Updating `current_value` recalculates `status`

---

## Phase 3 — Data Collection (Forms, Submissions, Locations)

> **Goal:** Field officers can submit data. Geofencing runs server-side. GIS endpoint returns GeoJSON.

### 3.1 `forms` entity & migration

```
id            UUID PK
title         VARCHAR(500) NOT NULL
description   TEXT DEFAULT ''
fields        JSONB DEFAULT '[]'
indicator_ids UUID[] DEFAULT '{}'
assigned_to   UUID[] DEFAULT '{}'
created_by    UUID NOT NULL FK → users(id)
status        VARCHAR(20) DEFAULT 'draft' CHECK IN ('draft','published')
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

`fields` JSONB element shape:
```json
{
  "id": "f1",
  "label": "...",
  "type": "text|number|textarea|radio|checkbox|select|date|gps|photo",
  "required": true,
  "placeholder": null,
  "options": null,
  "order": 1,
  "validation": null
}
```

### 3.2 `FormsService` & `FormsController`

```
GET    /api/forms       Auth: all          (query: status, assigned_to)
GET    /api/forms/:id   Auth: all
POST   /api/forms       Auth: admin, me_staff
PUT    /api/forms/:id   Auth: admin, me_staff
DELETE /api/forms/:id   Auth: admin, me_staff
```

Response `createdAt` is camelCase (same rule as indicators).

### 3.3 `project_locations` entity & migration

```
id            UUID PK
name          VARCHAR(255) NOT NULL
sector        VARCHAR(100) NOT NULL
description   TEXT nullable
lat           DOUBLE PRECISION NOT NULL
lng           DOUBLE PRECISION NOT NULL
radius_m      INTEGER DEFAULT 500
indicator_ids UUID[] DEFAULT '{}'
created_by    UUID NOT NULL FK → users(id)
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

`status` and `completion` are **never stored** — compute live on every read (see §3.7).

### 3.4 Geofencing helper

`src/submissions/helpers/geofence.ts`:

```typescript
export function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

`applyGeofence(submission, allLocations)`:
1. If `submission.location` is null/undefined → leave `on_site` and `location_id` as null
2. Iterate `allLocations`; for the first where `haversineMetres(...) <= loc.radius_m` → set `location_id = loc.id`, `on_site = true`, return
3. If no match → `on_site = false`, `location_id = null`

### 3.5 `submissions` entity & migration

```
id                 UUID PK  ← CLIENT-PROVIDED, no default
form_id            UUID NOT NULL FK → forms(id)
officer_id         UUID NOT NULL FK → users(id)
data               JSONB NOT NULL
location           JSONB nullable   -- { lat, lng }
location_id        UUID nullable FK → project_locations(id)
on_site            BOOLEAN nullable
submitted_at       TIMESTAMPTZ NOT NULL
validation_status  VARCHAR(20) DEFAULT 'pending' CHECK IN ('pending','approved','rejected')
validation_comment TEXT nullable
synced_at          TIMESTAMPTZ DEFAULT NOW()
```

**No `@PrimaryGeneratedColumn`** — use `@PrimaryColumn('uuid')` and accept the client-supplied value.

### 3.6 `SubmissionsService`

- `findAll(filters)` — query params: `form_id`, `officer_id`, `validation_status`, `page`, `per_page`
- `create(dto)`:
  1. Check if `id` already exists → `409 ConflictException`
  2. Persist submission
  3. Fetch all `project_locations`
  4. Run `applyGeofence()` and save updated `location_id` / `on_site`
  5. Return `{ id, status: 'accepted' }`
- `createBatch(dtos)`:
  1. For each dto independently:
     - If `id` already exists → add to `accepted` (idempotent, do not error)
     - Otherwise insert + geofence → add to `accepted`
     - On any other error → add to `rejected` with reason
  2. Return `{ accepted: string[], rejected: { id, reason }[] }`
- `validate(id, action, comment)`:
  1. Find submission → `404` if not found
  2. Set `validation_status` to `'approved'` or `'rejected'`
  3. Set `validation_comment = comment`
  4. Return full updated submission

### 3.7 `SubmissionsController`

```
GET  /api/submissions                  Auth: admin, me_staff, programme_staff
POST /api/submissions                  Auth: admin, me_staff, programme_staff
POST /api/submissions/batch            Auth: admin, me_staff, programme_staff
PUT  /api/submissions/:id/validate     Auth: admin, me_staff
```

**IMPORTANT — route ordering:** Register `POST /api/submissions/batch` **before** `POST /api/submissions` to avoid NestJS matching `/batch` as an `:id` param.

Response field names (see `BACKEND_CONTEXT.md §6.5`):
- camelCase: `formId`, `officerId`, `submittedAt`
- snake_case: `location_id`, `on_site`, `validation_status`, `validation_comment`

### 3.8 `LocationsService` — computed fields

`getAll(filters)`:
1. Fetch all `project_locations`
2. For each location, fetch its linked indicators (via `indicator_ids` array)
3. Compute:
   ```
   completion = indicators.length > 0
     ? avg(indicators.map(i => i.current_value / i.target * 100))
     : 0
   status = indicators.length === 0 ? 'no_data'
     : completion >= 90 ? 'on_track'
     : completion >= 60 ? 'at_risk'
     : 'off_track'
   ```
4. Build GeoJSON FeatureCollection (coordinates are `[lng, lat]` per GeoJSON standard)

`getIndicatorLocations(indicatorId)`:
- Find submissions linked to forms that include this indicator
- Return GeoJSON FeatureCollection of submission locations

### 3.9 `LocationsController`

```
GET    /api/locations/projects                         Auth: all   → GeoJSON FeatureCollection
GET    /api/locations/projects/:id                     Auth: all   → single properties object
POST   /api/locations/projects                         Auth: admin, me_staff
PUT    /api/locations/projects/:id                     Auth: admin, me_staff
DELETE /api/locations/projects/:id                     Auth: admin only
GET    /api/locations/indicators/:indicatorId           Auth: all   → GeoJSON FeatureCollection
```

### 3.10 Verify

- Submitting with a location inside a project location's radius sets `on_site = true` and populates `location_id`
- Duplicate submission ID on single POST returns `409`
- Duplicate submission ID in batch is silently accepted
- `GET /api/locations/projects` returns valid GeoJSON with computed `status` and `completion`

---

## Phase 4 — Dashboard, Alerts & Audit Log

> **Goal:** The executive dashboard is populated. Alerts and audit log are operational.

### 4.1 `alerts` entity & migration

```
id          UUID PK
user_id     UUID NOT NULL FK → users(id) ON DELETE CASCADE
title       VARCHAR(255) NOT NULL
description TEXT NOT NULL
type        VARCHAR(30) CHECK IN ('deadline','missed_target','data_flag','sync_success','system')
is_read     BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### 4.2 `AlertsService` & `AlertsController`

```
GET  /api/alerts              Auth: admin, me_staff, programme_staff
                              Query: unread_only, type, page, per_page
                              Response: newest-first plain array
POST /api/alerts/:id/read     Auth: admin, me_staff, programme_staff
POST /api/alerts/readAll      Auth: admin, me_staff, programme_staff
```

**IMPORTANT — route ordering:** Register `POST /api/alerts/readAll` **before** `POST /api/alerts/:id/read`.

Response field names: `isRead` (camelCase), `timestamp` = `created_at` value (rename in serialiser).

### 4.3 `audit_log` entity & migration

```
id          UUID PK
user_id     UUID NOT NULL
user_name   VARCHAR(255) NOT NULL
action      VARCHAR(20) CHECK IN ('create','update','delete','login','logout','submit')
resource    VARCHAR(50) NOT NULL
resource_id VARCHAR(255) NOT NULL
before_data JSONB nullable
after_data  JSONB nullable
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### 4.4 `AuditService` & `AuditController`

```
GET  /api/audit-log   Auth: admin only
                      Query: user_id, action, resource, from, to, page, per_page
                      Response: newest-first plain array
POST /api/audit-log   Auth: all
                      Response 201: full AuditEntry with id and timestamp
```

**Serialisation:** API response uses `before` / `after` (not `before_data` / `after_data`). Map in DTO/serialiser.

`AuditService` should also expose a `log(entry)` method so other services can write entries internally (e.g., login, role change, deletion).

### 4.5 `DashboardService`

`getExecutive(from?, to?)`:

1. **KPIs:**
   - Count all indicators; group by `status`
   - Count submissions where `submitted_at` is in the current calendar month
   - `pending_sync` always returns `0`

2. **Monthly trend** (6 most recent calendar months, oldest first):
   - For each month: `actual` = sum of all indicators' `current_value`, `target` = sum of all indicators' `target`
   - `month` label = abbreviated month name (`'Jan'`, `'Feb'`, etc.)

3. **Status distribution** — always return all three statuses even if count is 0

4. **SDG progress:**
   - For each unique SDG ID across all indicators
   - `progress` = average of `(current_value / target * 100)` across indicators that include this SDG
   - `name` = hardcoded lookup (use official SDG names; at minimum the ones referenced in seed data)

5. **Recent submissions** — last 5 full submission objects

6. **Recent alerts** — last 3 unread alerts for the requesting user

### 4.6 `DashboardController`

```
GET /api/dashboards/executive   Auth: all   (query: from, to)
```

Response shape per `BACKEND_CONTEXT.md §6.6`.

### 4.7 SDG name lookup table

`src/common/constants/sdg-names.ts` — map of SDG IDs 1–17 to official names. Used by `DashboardService`.

### 4.8 Verify

- Dashboard KPIs reflect seeded data
- Monthly trend returns exactly 6 entries
- Status distribution always has all three keys
- Marking an alert as read removes it from `recent_alerts`

---

## Phase 5 — Admin Features (Users, API Tokens, Reports)

> **Goal:** Full user management, API token lifecycle, and report metadata.

### 5.1 `UsersController` — management endpoints

```
GET /api/users               Auth: admin only
                             Query: role, search, page, per_page
                             Response: plain array with submission_count

POST /api/users/invite       Auth: admin only
                             Body: { name, email, role }
                             409 if email exists
                             Phase 1: create user with temp password, skip actual email

PUT /api/users/:id/role      Auth: admin only
                             Body: { role }
                             Response: full User object

PUT /api/users/:id/deactivate Auth: admin only
                              Response: full User object with active: false
```

`submission_count` on `GET /api/users` — a count of submissions where `officer_id = user.id`. Use a subquery or `LEFT JOIN`.

Never return `password_hash` in any user response.

Deactivated users: `AuthService.login()` must check `user.active === true` and return `401` if false.

Write audit log entries for: role changes, deactivation.

### 5.2 `api_tokens` entity & migration

```
id           UUID PK
name         VARCHAR(255) NOT NULL
token_hash   VARCHAR(255) UNIQUE NOT NULL
token_prefix VARCHAR(50) NOT NULL  ← partial token for display, e.g. "ekz_LIVE_****...x9P"
created_at   TIMESTAMPTZ DEFAULT NOW()
```

### 5.3 `ApiTokensService` & `ApiTokensController`

```
GET    /api/api-tokens       Auth: admin only
POST   /api/api-tokens       Auth: admin only
DELETE /api/api-tokens/:id   Auth: admin only
```

**Token generation** (`POST`):
1. Generate raw token: `'ekz_LIVE_' + randomBytes(16).toString('hex')` (48 chars total)
2. Build `token_prefix`: show first 14 chars + `****...` + last 3 chars
3. Hash with `bcrypt` (rounds = 10) and store as `token_hash`
4. Return `rawToken` in the `201` response — this is the **only time** the full token is visible

**`GET` response** — never return `token_hash` or `rawToken`; only `id`, `name`, `tokenPart` (`token_prefix`), `createdAt`.

### 5.4 Reports entity & migration

```
id            UUID PK
title         VARCHAR(500) NOT NULL
generated_by  VARCHAR(255) NOT NULL  ← display name string
generated_at  TIMESTAMPTZ NOT NULL
format        VARCHAR(20) NOT NULL
filters       JSONB NOT NULL DEFAULT '{}'
download_url  TEXT NOT NULL DEFAULT '#'
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### 5.5 `ReportsService` & `ReportsController`

```
GET  /api/reports           Auth: admin, me_staff, viewer
POST /api/reports/generate  Auth: admin, me_staff
```

`POST /api/reports/generate` only records metadata — no actual file generation. Set `download_url = '#'`.

Response shape per `BACKEND_CONTEXT.md §6.8`.

### 5.6 Verify

- Inviting a user with a duplicate email returns `409`
- `GET /api/users` includes `submission_count`
- A deactivated user's login returns `401`
- API token `POST` returns `rawToken` once; subsequent `GET` shows only `tokenPart`
- `password_hash` never appears in any response

---

## Cross-cutting concerns (apply throughout all phases)

### Response serialisation conventions

The frontend TypeScript interfaces are strict about field names. Follow this table exactly:

| Entity | camelCase fields in response | snake_case fields in response |
|---|---|---|
| Indicator | `createdAt`, `updatedAt` | all others |
| IndicatorProgress | `indicatorId`, `submittedBy` | all others |
| Form | `createdAt` | all others |
| Submission | `formId`, `officerId`, `submittedAt` | `location_id`, `on_site`, `validation_status`, `validation_comment` |
| Alert | `isRead`, `timestamp` | all others |
| AuditLog | `timestamp` | `user_id`, `user_name`, `action`, `resource`, `resource_id`, `before`, `after` |
| ApiToken | `tokenPart`, `createdAt` | all others |
| Location properties | `createdAt`, `updatedAt` | all others |

Use NestJS interceptors with `class-transformer` (`@Expose()`, `@Transform()`) or explicit DTO mapping in the service layer to handle these mixed conventions.

### Plain array responses

These endpoints must return plain arrays — not objects with a `data` key or paginated envelopes:

- `GET /api/indicators`
- `GET /api/submissions`
- `GET /api/users`
- `GET /api/audit-log`
- `GET /api/forms`
- `GET /api/alerts`
- `GET /api/reports`

### Error responses

All errors must use:
```json
{ "message": "...", "errors": { "field": ["..."] } }
```

`errors` is omitted when there are no field-level details.

### Audit log — server-side writes

Write audit entries automatically (via `AuditService.log()`) for:
- `login` — on successful login
- `update` — on user role change
- `delete` — on user deactivation, indicator deletion, node deletion

### Security

- Never log or return `password_hash`
- Never log or return raw API tokens after creation
- Validate and sanitise all input via `ValidationPipe` with `whitelist: true`
- Do not trust `user_id` from request body when the correct value is available from `req.user`

---

## File & folder structure (final)

```
src/
├── main.ts
├── app.module.ts
├── data-source.ts                       ← TypeORM CLI data source
├── common/
│   ├── enums/
│   │   └── user-role.enum.ts
│   ├── constants/
│   │   └── sdg-names.ts
│   └── filters/
│       └── http-exception.filter.ts
├── database/
│   ├── migrations/
│   │   └── *.ts
│   └── seeds/
│       └── seed.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── user.entity.ts
├── logframe/
│   ├── logframe.module.ts
│   ├── logframe.controller.ts
│   ├── logframe.service.ts
│   └── logframe-node.entity.ts
├── indicators/
│   ├── indicators.module.ts
│   ├── indicators.controller.ts
│   ├── indicators.service.ts
│   ├── indicator.entity.ts
│   ├── indicator-progress.entity.ts
│   └── helpers/
│       └── compute-status.ts
├── forms/
│   ├── forms.module.ts
│   ├── forms.controller.ts
│   ├── forms.service.ts
│   └── form.entity.ts
├── submissions/
│   ├── submissions.module.ts
│   ├── submissions.controller.ts
│   ├── submissions.service.ts
│   ├── submission.entity.ts
│   └── helpers/
│       └── geofence.ts
├── locations/
│   ├── locations.module.ts
│   ├── locations.controller.ts
│   ├── locations.service.ts
│   └── project-location.entity.ts
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── alerts.service.ts
│   └── alert.entity.ts
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── report.entity.ts
├── audit/
│   ├── audit.module.ts
│   ├── audit.controller.ts
│   ├── audit.service.ts
│   └── audit-entry.entity.ts
└── api-tokens/
    ├── api-tokens.module.ts
    ├── api-tokens.controller.ts
    ├── api-tokens.service.ts
    └── api-token.entity.ts
```

---

## Environment variables reference

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ekz_me
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=8h
PORT=3000
CORS_ORIGINS=http://localhost:3001
```

---

## Definition of done (per phase)

| Phase | Done when |
|---|---|
| 0 | App starts, connects to Postgres, migration for `uuid-ossp` runs |
| 1 | Login returns JWT, `/me` works, wrong role returns 403, seed creates 4 users |
| 2 | Logframe tree builds correctly, indicator status auto-computes, progress endpoint returns oldest-first |
| 3 | Submissions store client UUIDs, geofencing sets `on_site`, GeoJSON passes validation |
| 4 | Dashboard KPIs match DB state, all 6 monthly trend entries present, alerts read/unread toggle works |
| 5 | Deactivated user blocked at login, API token raw value shown once only, report metadata saved |
