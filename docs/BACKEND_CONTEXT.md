# EKZ M&E System — Backend Context

**For:** NestJS + PostgreSQL backend developer  
**Frontend:** Next.js 16 (TypeScript), already built and running against mock handlers  
**Your job:** Replace the MSW mocks with a real NestJS API that the frontend can connect to by setting `NEXT_PUBLIC_API_URL=http://localhost:3000` and `NEXT_PUBLIC_MOCK_ENABLED=false`

---

## 1. Project Overview

The **Ekiti Knowledge Zone (EKZ) Monitoring & Evaluation System** is an AfDB-funded M&E platform for Ekiti State, Nigeria. It tracks programme performance through a logframe hierarchy, collects field data via mobile-friendly forms, and visualises progress through dashboards and GIS maps.

### Key data flow

```
Logframe nodes (Goal → Outcome → Output → Activity)
    └── Indicators linked to nodes
        └── Forms linked to indicators
            └── Submissions (online or offline-cached, then batch-synced)
                └── Indicator progress updated manually by me_staff
                    └── Dashboard KPIs + Map visualisation
```

### Field officers work offline

The frontend caches forms, indicators, and project locations to IndexedDB at login. Submissions are queued locally and synced via `POST /api/submissions/batch` when connectivity is restored.

---

## 2. Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS 10+ |
| Database | PostgreSQL 15+ |
| ORM | TypeORM (recommended) or Prisma |
| Auth | JWT (access token: 8h, refresh: 30d) using `@nestjs/jwt` + `passport-jwt` |
| Validation | `class-validator` + `class-transformer` |

---

## 3. Roles & Authorization

Four roles exist. Every protected endpoint specifies which roles are allowed.

```typescript
enum UserRole {
  ADMIN = 'admin',
  ME_STAFF = 'me_staff',
  PROGRAMME_STAFF = 'programme_staff',
  VIEWER = 'viewer',
}
```

Use a `@Roles(...roles)` decorator + `RolesGuard` on all protected routes. The frontend trusts the backend to enforce role restrictions — do not rely on frontend-only guards.

---

## 4. PostgreSQL Schema

All IDs are UUID v4 (`uuid_generate_v4()`). All timestamps are `TIMESTAMPTZ` stored in UTC. Enable `uuid-ossp` extension.

### `users`

```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role         VARCHAR(50) NOT NULL CHECK (role IN ('admin','me_staff','programme_staff','viewer')),
  avatar       TEXT,
  active       BOOLEAN NOT NULL DEFAULT true,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `logframe_nodes`

```sql
CREATE TABLE logframe_nodes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logframe_id  VARCHAR(50) NOT NULL DEFAULT 'lf_1',
  type         VARCHAR(20) NOT NULL CHECK (type IN ('goal','outcome','output','activity')),
  code         VARCHAR(50) NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  parent_id    UUID REFERENCES logframe_nodes(id) ON DELETE RESTRICT,
  "order"      INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Parent constraint rules (enforce in service layer):**

| Node type | `parent_id` must reference a node of type |
|---|---|
| `goal` | `null` |
| `outcome` | `goal` |
| `output` | `outcome` |
| `activity` | `output` |

### `indicators`

```sql
CREATE TABLE indicators (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  VARCHAR(50) UNIQUE NOT NULL,
  name                  VARCHAR(500) NOT NULL,
  description           TEXT NOT NULL,
  level                 VARCHAR(20) NOT NULL CHECK (level IN ('impact','outcome','output')),
  unit                  VARCHAR(100) NOT NULL,
  baseline              NUMERIC NOT NULL DEFAULT 0,
  target                NUMERIC NOT NULL,
  current_value         NUMERIC NOT NULL DEFAULT 0,
  status                VARCHAR(20) NOT NULL CHECK (status IN ('on_track','at_risk','off_track')),
  frequency             VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly','quarterly','bi_annually','annually')),
  logframe_level_id     UUID REFERENCES logframe_nodes(id) ON DELETE SET NULL,
  sdg_ids               INTEGER[] NOT NULL DEFAULT '{}',
  responsible_party     VARCHAR(255) NOT NULL,
  means_of_verification TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Status computation rule** — recalculate `status` whenever `current_value` is updated:

```
ratio = current_value / target
if ratio >= 0.90 → 'on_track'
if ratio >= 0.60 → 'at_risk'
else             → 'off_track'
```

### `indicator_progress`

```sql
CREATE TABLE indicator_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id  UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  value         NUMERIC NOT NULL,
  date          TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  submitted_by  VARCHAR(255) NOT NULL,  -- display name string, not FK
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `forms`

```sql
CREATE TABLE forms (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(500) NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  fields        JSONB NOT NULL DEFAULT '[]',
  indicator_ids UUID[] NOT NULL DEFAULT '{}',
  assigned_to   UUID[] NOT NULL DEFAULT '{}',
  created_by    UUID NOT NULL REFERENCES users(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**`fields` JSONB structure** — each element:

```json
{
  "id": "f1",
  "label": "Trainee Full Name",
  "type": "text",
  "required": true,
  "placeholder": null,
  "options": null,
  "order": 1,
  "validation": null
}
```

Valid `type` values: `text`, `number`, `textarea`, `radio`, `checkbox`, `select`, `date`, `gps`, `photo`

### `submissions`

```sql
CREATE TABLE submissions (
  id                 UUID PRIMARY KEY,  -- CLIENT-PROVIDED UUID, do not auto-generate
  form_id            UUID NOT NULL REFERENCES forms(id),
  officer_id         UUID NOT NULL REFERENCES users(id),
  data               JSONB NOT NULL,
  location           JSONB,             -- { lat: number, lng: number } or null
  location_id        UUID REFERENCES project_locations(id),
  on_site            BOOLEAN,
  submitted_at       TIMESTAMPTZ NOT NULL,
  validation_status  VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','approved','rejected')),
  validation_comment TEXT,
  synced_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> **Critical:** The `id` comes from the frontend (UUID v4 generated client-side). Accept and store it as-is. This is essential for the offline sync flow — the same ID is written to IndexedDB before submission and must match what's stored in the DB. Return `409` if a submission with that ID already exists.

**Geofencing** — on every submission ingest (both single and batch), compute geofencing server-side:

```typescript
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// For each submission with a location, iterate project_locations and find the first match:
// if (haversineMetres(sub.location.lat, sub.location.lng, loc.lat, loc.lng) <= loc.radius_m)
//   → set submission.location_id = loc.id, submission.on_site = true
// If no match found → submission.on_site = false, location_id = null
```

### `project_locations`

```sql
CREATE TABLE project_locations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  sector        VARCHAR(100) NOT NULL,
  description   TEXT,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  radius_m      INTEGER NOT NULL DEFAULT 500,
  indicator_ids UUID[] NOT NULL DEFAULT '{}',
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `alerts`

```sql
CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type        VARCHAR(30) NOT NULL CHECK (type IN ('deadline','missed_target','data_flag','sync_success','system')),
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `audit_log`

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL,
  user_name   VARCHAR(255) NOT NULL,
  action      VARCHAR(20) NOT NULL CHECK (action IN ('create','update','delete','login','logout','submit')),
  resource    VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  before_data JSONB,
  after_data  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `api_tokens`

```sql
CREATE TABLE api_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  token_hash   VARCHAR(255) UNIQUE NOT NULL,
  token_prefix VARCHAR(50) NOT NULL,  -- partial token shown in UI, e.g. "ekz_LIVE_****...x9P"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. NestJS Module Structure

```
src/
├── main.ts
├── app.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts   (POST /api/auth/login, GET /api/auth/me)
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── roles.guard.ts
│   └── roles.decorator.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts  (GET /api/users, POST /api/users/invite, PUT /api/users/:id/role, PUT /api/users/:id/deactivate)
│   └── users.service.ts
├── logframe/
│   ├── logframe.module.ts
│   ├── logframe.controller.ts
│   └── logframe.service.ts
├── indicators/
│   ├── indicators.module.ts
│   ├── indicators.controller.ts
│   └── indicators.service.ts
├── forms/
│   ├── forms.module.ts
│   ├── forms.controller.ts
│   └── forms.service.ts
├── submissions/
│   ├── submissions.module.ts
│   ├── submissions.controller.ts
│   └── submissions.service.ts
├── locations/
│   ├── locations.module.ts
│   ├── locations.controller.ts
│   └── locations.service.ts
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   └── alerts.service.ts
├── reports/
│   ├── reports.module.ts
│   ├── reports.controller.ts
│   └── reports.service.ts
├── audit/
│   ├── audit.module.ts
│   ├── audit.controller.ts
│   └── audit.service.ts
└── api-tokens/
    ├── api-tokens.module.ts
    ├── api-tokens.controller.ts
    └── api-tokens.service.ts
```

**Global prefix:** Set `app.setGlobalPrefix('api')` in `main.ts` so all routes are under `/api/...`.

**CORS:** Enable for `http://localhost:3001` (or whatever port the frontend runs on) and the production domain.

---

## 6. API Endpoints — Complete Contract

> Field names throughout are **snake_case**. The frontend is built to this exact shape. Any deviation in field names, nesting, or types will break the UI.

### 6.1 Auth

#### `POST /api/auth/login`
No auth required.

**Request:**
```json
{ "email": "admin@ekz.com", "password": "Admin123!" }
```

**Response 200:**
```json
{
  "user": { "id": "uuid", "email": "admin@ekz.com", "name": "Adebola Johnson", "role": "admin", "avatar": null },
  "token": "eyJ..."
}
```

Return `401` for invalid credentials. Return `429` for rate limit exceeded.

#### `GET /api/auth/me`
Auth required. All roles.

**Response 200:**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "admin", "avatar": null }
}
```

---

### 6.2 Logframe

#### `GET /api/logframe`
Auth required. All roles.

Returns the full tree as a **nested array of root nodes**. Build the tree server-side — do not return a flat list.

```json
[
  {
    "id": "uuid",
    "logframe_id": "lf_1",
    "type": "goal",
    "code": "GOAL",
    "title": "...",
    "description": "...",
    "parent_id": null,
    "order": 1,
    "indicators": [],
    "children": [
      {
        "id": "uuid",
        "type": "outcome",
        "code": "OC-1",
        "indicators": [ ...full Indicator objects... ],
        "children": [ ...output nodes... ]
      }
    ]
  }
]
```

Each node's `indicators` array contains full `Indicator` objects (not just IDs).

#### `POST /api/logframe/nodes`
Auth: `admin`, `me_staff`.

**Request:**
```json
{ "type": "output", "code": "OP-1.3", "title": "...", "description": "...", "parent_id": "uuid", "order": 3 }
```

Enforce parent type constraints (see schema section). Return `400` on constraint violation.

**Response 201:** Full `LogframeNode` with empty `indicators: []` and `children: []`.

#### `PUT /api/logframe/nodes/:id`
Auth: `admin`, `me_staff`. Partial update. **Response 200:** Full updated node.

#### `DELETE /api/logframe/nodes/:id`
Auth: `admin`, `me_staff`. Return `400` if node has children. **Response 204.**

#### `POST /api/logframe/nodes/:id/indicators`
Auth: `admin`, `me_staff`.

**Request:** `{ "indicator_id": "uuid" }`  
**Response 200:** `{ "success": true }`  
Return `409` if already linked.

#### `DELETE /api/logframe/nodes/:nodeId/indicators/:indicatorId`
Auth: `admin`, `me_staff`. **Response 204.**

---

### 6.3 Indicators

#### `GET /api/indicators`
Auth required. All roles.

**Query params:** `status`, `logframe_level_id`, `sdg_id` (integer), `frequency`, `search`, `page`, `per_page`

**Response 200: plain array** (not paginated envelope). The frontend uses this for full-list select dropdowns.

```json
[
  {
    "id": "uuid",
    "code": "OUT-1.1",
    "name": "Number of youths completing technical training",
    "description": "...",
    "level": "output",
    "unit": "individuals",
    "baseline": 0,
    "target": 5000,
    "current_value": 3450,
    "status": "on_track",
    "frequency": "quarterly",
    "logframe_level_id": "uuid",
    "sdg_ids": [4, 8],
    "responsible_party": "TVET Directorate",
    "means_of_verification": "Training completion certificates",
    "createdAt": "2026-01-05T00:00:00Z",
    "updatedAt": "2026-04-02T00:00:00Z"
  }
]
```

> Note timestamps are `createdAt` / `updatedAt` (camelCase). This is intentional — the frontend TypeScript interface uses camelCase for these two fields only.

#### `GET /api/indicators/:id`
Auth required. All roles. **Response 200:** Single indicator or `404`.

#### `GET /api/indicators/:id/progress`
Auth required. All roles.

**Query params:** `from` (ISO date), `to` (ISO date)

**Response 200:** Array of progress entries, oldest first.

```json
[
  { "id": "uuid", "indicatorId": "uuid", "value": 0, "date": "2026-01-05T00:00:00Z", "notes": null, "submittedBy": "System" }
]
```

> Fields: `indicatorId` (camelCase), `submittedBy` (camelCase). This is what the frontend expects.

#### `POST /api/indicators`
Auth: `admin`, `me_staff`.

Sets `current_value = baseline` on creation. Recalculates `status` from the ratio formula. **Response 201:** Full indicator.

#### `PUT /api/indicators/:id`
Auth: `admin`, `me_staff`. Partial update. Recalculate `status` if `current_value` or `target` changes. Refresh `updatedAt`. **Response 200:** Full updated indicator.

#### `DELETE /api/indicators/:id`
Auth: `admin` only. Return `409` if indicator has linked submissions. **Response 204.**

---

### 6.4 Forms

#### `GET /api/forms`
Auth required. All roles.

**Query params:** `status` (`draft`|`published`), `assigned_to` (user UUID)

**Response 200:** Plain array of `FormSchema` objects.

```json
[
  {
    "id": "uuid",
    "title": "Youth Training Enrollment Log",
    "description": "...",
    "fields": [ ...FormField objects... ],
    "indicator_ids": ["uuid"],
    "assigned_to": ["uuid"],
    "created_by": "uuid",
    "status": "published",
    "createdAt": "2026-03-01T00:00:00Z"
  }
]
```

> `createdAt` is camelCase (matches frontend type).

#### `GET /api/forms/:id`
Auth required. All roles. **Response 200:** Single form or `404`.

#### `POST /api/forms`
Auth: `admin`, `me_staff`. **Response 201:** Full form.

#### `PUT /api/forms/:id`
Auth: `admin`, `me_staff`. Partial update. **Response 200:** Full form.

#### `DELETE /api/forms/:id`
Auth: `admin`, `me_staff`. **Response 204.**

---

### 6.5 Submissions

#### `GET /api/submissions`
Auth: `admin`, `me_staff`, `programme_staff`.

**Query params:** `form_id`, `officer_id`, `validation_status`, `page`, `per_page`

**Response 200: plain array** (not paginated envelope).

```json
[
  {
    "id": "uuid",
    "formId": "uuid",
    "officerId": "uuid",
    "data": { "Field Label": "value" },
    "location": { "lat": 7.53, "lng": 5.21 },
    "location_id": "uuid-or-null",
    "on_site": true,
    "submittedAt": "2026-04-06T09:15:00Z",
    "validation_status": "pending",
    "validation_comment": null
  }
]
```

> `formId`, `officerId`, `submittedAt` are camelCase. `location_id`, `on_site`, `validation_status`, `validation_comment` are snake_case. Match these exactly.

#### `POST /api/submissions`
Auth: `admin`, `me_staff`, `programme_staff`.

**Request:**
```json
{
  "id": "client-uuid",
  "formId": "uuid",
  "officerId": "uuid",
  "data": { ... },
  "location": { "lat": 7.53, "lng": 5.21 },
  "submittedAt": "2026-04-06T09:15:00Z"
}
```

After storing, run geofencing to set `location_id` and `on_site`.

**Response 201:**
```json
{ "id": "client-uuid", "status": "accepted" }
```

Return `409` if `id` already exists.

#### `POST /api/submissions/batch`
Auth: `admin`, `me_staff`, `programme_staff`.

**Request:** Array of submission objects (same shape as single POST).

**Response 200:**
```json
{
  "accepted": ["uuid1", "uuid2"],
  "rejected": [{ "id": "uuid3", "reason": "Form form_x is no longer active" }]
}
```

Process each submission independently. For duplicates, add to `accepted` silently (idempotent). Run geofencing on each accepted submission.

#### `PUT /api/submissions/:id/validate`
Auth: `admin`, `me_staff`.

**Request:**
```json
{ "action": "approve", "comment": "Verified." }
```

`action` is `"approve"` or `"reject"`. Sets `validation_status` accordingly.

**Response 200:** Full updated submission object.

---

### 6.6 Dashboard

#### `GET /api/dashboards/executive`
Auth required. All roles.

**Query params:** `from` (ISO date), `to` (ISO date)

**Response 200:**
```json
{
  "kpis": {
    "total_indicators": 14,
    "on_track": 8,
    "at_risk": 4,
    "off_track": 2,
    "submissions_this_month": 47,
    "pending_sync": 0
  },
  "monthly_trend": [
    { "month": "Nov", "actual": 1200, "target": 1500 }
  ],
  "status_distribution": [
    { "status": "on_track", "count": 8 },
    { "status": "at_risk", "count": 4 },
    { "status": "off_track", "count": 2 }
  ],
  "sdg_progress": [
    { "sdg_id": 8, "name": "Economic Growth", "progress": 62 }
  ],
  "recent_submissions": [ ...last 5 full Submission objects... ],
  "recent_alerts": [ ...last 3 unread Alert objects for the requesting user... ]
}
```

**Notes:**
- `monthly_trend`: 6 most recent calendar months, oldest first. `month` is abbreviated month name (`"Jan"`, `"Feb"`, etc.). `actual` = sum of `current_value` across all indicators for that month. `target` = sum of `target` across all indicators.
- `status_distribution`: Always include all three statuses, even if count is 0.
- `sdg_progress`: One entry per SDG that has at least one linked indicator. `progress` = average completion percentage of linked indicators. `name` can be a hardcoded SDG name lookup by `sdg_id`.
- `pending_sync`: Can always return `0` — the backend has no concept of client-side pending submissions.

---

### 6.7 GIS / Locations

#### `GET /api/locations/projects`
Auth required. All roles.

**Query params:** `sector`, `status`

**Response 200: GeoJSON FeatureCollection.**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "uuid",
        "name": "EKZ TVET Centre",
        "sector": "Education",
        "description": "...",
        "lat": 7.6211,
        "lng": 5.2216,
        "radius_m": 500,
        "status": "on_track",
        "completion": 69,
        "indicator_ids": ["uuid"],
        "created_by": "uuid",
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-01T00:00:00Z"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [5.2216, 7.6211]
      }
    }
  ]
}
```

> GeoJSON `coordinates` are `[longitude, latitude]` (GeoJSON standard). The frontend handles the lat/lng swap for Leaflet.

> `status` and `completion` are **computed** from linked indicators — never stored. Computation:
> - `completion` = average of `(current_value / target * 100)` across all indicators in `indicator_ids`
> - `status`: apply the same threshold rule (≥90% on_track, ≥60% at_risk, <60% off_track) to the average completion
> - If no linked indicators: `status = 'no_data'`, `completion = 0`

The `properties` object must also include all stored fields (`lat`, `lng`, `radius_m`, `description`, `created_by`, `createdAt`, `updatedAt`) — the admin page reads these back when editing.

#### `GET /api/locations/projects/:id`
Auth required. All roles. **Response 200:** Single feature properties object (not GeoJSON wrapper).

#### `POST /api/locations/projects`
Auth: `admin`, `me_staff`.

**Request:**
```json
{
  "name": "EKZ TVET Centre",
  "sector": "Education",
  "description": "...",
  "lat": 7.6211,
  "lng": 5.2216,
  "radius_m": 500,
  "indicator_ids": ["uuid"],
  "created_by": "uuid"
}
```

**Response 201:** The new location properties object.

#### `PUT /api/locations/projects/:id`
Auth: `admin`, `me_staff`. Partial update. **Response 200:** Updated location properties.

#### `DELETE /api/locations/projects/:id`
Auth: `admin` only. **Response 204.**

#### `GET /api/locations/indicators/:indicatorId`
Auth required. All roles.

Returns GeoJSON FeatureCollection of data collection points for a single indicator (based on submissions linked to this indicator's form).

---

### 6.8 Reports

#### `GET /api/reports`
Auth: `admin`, `me_staff`, `viewer`.

**Response 200:** Plain array of report records.

```json
[
  {
    "id": "uuid",
    "title": "Q1 2026 Progress Report",
    "generated_by": "Adebola Johnson",
    "generated_at": "2026-04-01T10:00:00Z",
    "format": "pdf",
    "filters": { "date_from": "2026-01-01", "date_to": "2026-03-31" },
    "download_url": "https://..."
  }
]
```

#### `POST /api/reports/generate`
Auth: `admin`, `me_staff`.

**Request:**
```json
{
  "title": "Indicator Status Export",
  "format": "pdf",
  "indicator_ids": [],
  "logframe_level_id": null,
  "location_id": null,
  "date_from": "2026-01-01",
  "date_to": "2026-04-06"
}
```

> Reports are generated **client-side** (jsPDF/SheetJS). This endpoint only records the metadata. `download_url` can be `"#"` for now.

**Response 201:**
```json
{ "report_id": "uuid", "download_url": "#", "format": "pdf" }
```

---

### 6.9 Alerts

#### `GET /api/alerts`
Auth: `admin`, `me_staff`, `programme_staff`.

**Query params:** `unread_only` (boolean), `type`, `page`, `per_page`

**Response 200: plain array**, newest first.

```json
[
  {
    "id": "uuid",
    "title": "Indicator Below Target",
    "description": "...",
    "type": "missed_target",
    "isRead": false,
    "timestamp": "2026-04-06T08:00:00Z"
  }
]
```

> `isRead` is camelCase. `timestamp` (not `created_at`). Match exactly.

#### `POST /api/alerts/:id/read`
Auth: `admin`, `me_staff`, `programme_staff`. Body: `{}`.
**Response 200:** `{ "success": true }`

#### `POST /api/alerts/readAll`
Auth: `admin`, `me_staff`, `programme_staff`. Body: `{}`.
**Response 200:** `{ "success": true }`

---

### 6.10 Audit Log

#### `GET /api/audit-log`
Auth: `admin` only.

**Query params:** `user_id`, `action`, `resource`, `from`, `to`, `page`, `per_page`

**Response 200: plain array**, newest first.

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "user_name": "Funke Ogunleye",
    "action": "update",
    "resource": "indicator",
    "resource_id": "uuid",
    "before": { "status": "on_track" },
    "after": { "status": "at_risk" },
    "timestamp": "2026-04-06T07:30:00Z"
  }
]
```

> Field is `before`/`after` (not `before_data`/`after_data`) in the API response — rename in your serializer.

#### `POST /api/audit-log`
Auth required. All roles.

The frontend calls this client-side after actions. The backend should also write audit entries server-side for sensitive operations (login, user role changes, deletions).

**Request:**
```json
{
  "user_id": "uuid",
  "user_name": "Funke Ogunleye",
  "action": "update",
  "resource": "indicator",
  "resource_id": "uuid",
  "before": { "status": "on_track" },
  "after": { "status": "at_risk" }
}
```

**Response 201:** Full `AuditEntry` with `id` and `timestamp`.

---

### 6.11 User Management

#### `GET /api/users`
Auth: `admin` only.

**Query params:** `role`, `search`, `page`, `per_page`

**Response 200: plain array.**

```json
[
  {
    "id": "uuid",
    "email": "admin@ekz.com",
    "name": "Adebola Johnson",
    "role": "admin",
    "avatar": null,
    "active": true,
    "last_login": "2026-04-06T08:30:00Z",
    "submission_count": 0
  }
]
```

Never return `password_hash`.

#### `POST /api/users/invite`
Auth: `admin` only.

**Request:** `{ "name": "...", "email": "...", "role": "me_staff" }`  
**Response 200:** `{ "message": "Invite sent to g.okonkwo@ekz.com" }`  
Return `409` if email already exists.

For Phase 1, create the user with a temporary password and skip the email — just return the success message.

#### `PUT /api/users/:id/role`
Auth: `admin` only.

**Request:** `{ "role": "me_staff" }`  
**Response 200:** Full updated `User` object.

#### `PUT /api/users/:id/deactivate`
Auth: `admin` only.

**Response 200:** Full `User` object with `active: false`. Deactivated users should receive `401` on login.

---

### 6.12 API Tokens

#### `GET /api/api-tokens`
Auth: `admin` only.

**Response 200:** Array of masked token objects.

```json
[{ "id": "uuid", "name": "Tableau Integration", "tokenPart": "ekz_LIVE_****...x9P", "createdAt": "2026-04-06T10:00:00Z" }]
```

#### `POST /api/api-tokens`
Auth: `admin` only.

**Request:** `{ "name": "AfDB Data Feed" }`

Generate a random token (e.g. `ekz_LIVE_` + 32 random hex chars). Store the hash. Return the raw token **only this once**.

**Response 201:**
```json
{ "id": "uuid", "name": "...", "tokenPart": "ekz_LIVE_****...y7Q", "createdAt": "...", "rawToken": "ekz_LIVE_a3f9..." }
```

#### `DELETE /api/api-tokens/:id`
Auth: `admin` only.

**Response 200:** `{ "success": true }`

---

## 7. Error Format

All error responses must use:

```json
{
  "message": "Human-readable error message.",
  "errors": {
    "email": ["This field is required."]
  }
}
```

`errors` is optional. `message` is always present.

Standard HTTP codes used: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

> **401 auto-logout:** When the frontend receives a `401`, it automatically logs the user out and redirects to `/login`. This only fires if the browser is online (there is an `navigator.onLine` guard to protect offline sessions).

---

## 8. Business Logic Rules

### Indicator status thresholds

```
ratio = current_value / target
≥ 0.90 → on_track
≥ 0.60 → at_risk
< 0.60 → off_track
```

Recalculate whenever `current_value` or `target` changes.

### Geofencing

On every submission ingest (single and batch), if `location` is provided:

1. Fetch all `project_locations`
2. For each location, compute `haversineMetres(sub.lat, sub.lng, loc.lat, loc.lng)`
3. If distance ≤ `loc.radius_m`: set `location_id = loc.id`, `on_site = true`, stop
4. If no match: `on_site = false`, `location_id = null`

### Location enrichment (computed, never stored)

`GET /api/locations/projects` must compute `completion` and `status` live:

```typescript
const completion = indicators.length > 0
  ? average(indicators.map(i => (i.current_value / i.target) * 100))
  : 0;

const status = indicators.length === 0 ? 'no_data'
  : completion >= 90 ? 'on_track'
  : completion >= 60 ? 'at_risk'
  : 'off_track';
```

### Logframe parent type constraints

Enforce in service layer before insert:

| type | allowed parent type |
|---|---|
| `goal` | none (`parent_id` must be `null`) |
| `outcome` | `goal` |
| `output` | `outcome` |
| `activity` | `output` |

Return `400 Bad Request` on violation.

### Submission ID ownership

The `id` field in submission requests is **client-generated UUID**. Accept it, store it, return it in responses. On `POST /api/submissions`, return `409` if `id` already exists. In batch, silently put duplicates in `accepted` (idempotent).

---

## 9. Auth Implementation

```typescript
// JWT payload shape
interface JwtPayload {
  sub: string;    // user UUID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
```

- Sign with HS256, secret from `JWT_SECRET` env var
- Access token: 8h expiry
- Apply `JwtAuthGuard` globally, then `@Public()` decorator on login endpoint
- Extract role from JWT payload — do not re-fetch user on every request (for performance)
- `RolesGuard` reads `@Roles(...)` metadata and compares against `request.user.role`

---

## 10. Phased Delivery Order

Build in this order to match the frontend's dependency graph:

### Phase 1 — Foundation
1. NestJS project setup, TypeORM + PostgreSQL connection, migrations
2. Users table + `POST /api/auth/login` + `GET /api/auth/me`
3. JWT guard, RolesGuard, `@Roles()` decorator
4. Seed script: create at least one admin user

### Phase 2 — Core Data Models
5. `logframe_nodes` table + full logframe CRUD + tree builder
6. `indicators` table + full indicator CRUD + progress endpoint
7. Wire logframe ↔ indicator link endpoints

### Phase 3 — Data Collection
8. `forms` table + CRUD
9. `submissions` table + single POST + batch POST (with geofencing)
10. `project_locations` table + full CRUD + GeoJSON endpoint (with computed status/completion)
11. Submission validate endpoint (`PUT /api/submissions/:id/validate`)

### Phase 4 — Dashboard & Supporting
12. `GET /api/dashboards/executive` — aggregation queries
13. `alerts` table + CRUD
14. `audit_log` table + CRUD

### Phase 5 — Admin Features
15. Full user management endpoints (invite, role, deactivate)
16. `api_tokens` table + CRUD
17. Reports metadata endpoints

---

## 11. Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/ekz_me
JWT_SECRET=your-strong-secret-here
JWT_EXPIRES_IN=8h
PORT=3000
CORS_ORIGINS=http://localhost:3001
```

---

## 12. Frontend Integration Notes

1. **Set `NEXT_PUBLIC_API_URL=http://localhost:3000`** (no trailing slash)
2. **Set `NEXT_PUBLIC_MOCK_ENABLED=false`** — this disables MSW and sends requests to the real backend
3. The frontend sends `Authorization: Bearer <token>` on every request except login
4. On `401`, the frontend auto-logs the user out (only when `navigator.onLine` is true)
5. Form submissions have client-generated UUIDs — the backend must accept them as primary keys
6. `GET /api/indicators` and `GET /api/submissions` and `GET /api/users` and `GET /api/audit-log` must return **plain arrays**, not paginated envelopes (the frontend is not built to unwrap envelopes for these endpoints yet)
7. Timestamps in responses: the convention in this codebase is mixed — `createdAt`/`updatedAt` (camelCase) for indicators and forms, `created_at` (snake_case) in the DB. Serialise to camelCase in your DTOs/interceptors for these two fields to match what the frontend TypeScript interfaces expect.
8. The `data` field in submissions uses form **field labels** as keys (not field IDs). Store and return as-is.
