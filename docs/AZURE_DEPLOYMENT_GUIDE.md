# EKZ M&E Backend — Azure Deployment Guide

This document contains everything a cloud engineer needs to deploy this application on Azure.
No code changes are required — the application is deployment-ready.

---

## 1. Application Overview

| Item | Value |
|------|-------|
| Name | EKZ M&E System API |
| Purpose | Monitoring & Evaluation backend for the Ekiti Knowledge Zone programme |
| Language | TypeScript (ES2023 target) |
| Runtime | Node.js 20 LTS (minimum 20.x, recommended 22.x) |
| Framework | NestJS 11 |
| Package Manager | pnpm 10.x |
| Database | PostgreSQL 15+ |
| SMTP | External (SMTP2GO — already configured, no Azure mail service needed) |
| API Prefix | All routes under `/api/*` |
| Swagger Docs | `/api/docs` (HTML), `/api/docs-json` (JSON), `/api/docs-yaml` (YAML) |
| Health Check | `GET /api/health` — returns `{ status: "ok", timestamp }`, no auth required |

---

## 2. Required Azure Resources

### 2.1 Compute — Azure App Service (Linux) or Azure Container Apps

**Option A: App Service (simpler)**
- Plan: B1 or higher (needs always-on for the cron scheduler)
- Runtime stack: Node 20 LTS or Node 22 LTS
- OS: Linux
- Always On: **Enabled** (required — the app runs a daily cron job at 08:00 UTC)

**Option B: Container Apps (if containerised)**
- See Dockerfile notes in Section 7 below
- Min replicas: 1 (cron scheduler needs at least one instance running)

### 2.2 Database — Azure Database for PostgreSQL Flexible Server

- Version: **15 or 16**
- SKU: Burstable B1ms for dev/staging, General Purpose D2s_v3+ for production
- Storage: 32 GB minimum (grows with audit log and submissions)
- Extensions required: **`uuid-ossp`** (the first migration enables it via `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
- SSL: Require SSL connections (the `pg` driver supports this via the connection string)
- Connection string format:
  ```
  postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require
  ```

**Important:** The `uuid-ossp` extension must be allowed. On Azure Flexible Server, it is available
by default under Server Parameters → `azure.extensions`. Ensure `UUID-OSSP` is in the allowlist.

### 2.3 Networking

- The App Service and PostgreSQL server should be in the same VNet or use private endpoints
- PostgreSQL firewall must allow connections from the App Service
- Outbound HTTPS (port 443) must be open for npm registry during build
- Outbound SMTP (port 587) must be open for `mail.smtp2go.com` — this is the transactional email relay

---

## 3. Environment Variables

All configuration is via environment variables. **No `.env` file should exist in production** — use
Azure App Service Configuration (Application Settings) or Azure Key Vault references.

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/ekz_me?sslmode=require` | PostgreSQL connection string |
| `JWT_SECRET` | Yes | (generate a random 64-char string) | Secret for signing JWT tokens. **Must be cryptographically random in production.** |
| `JWT_EXPIRES_IN` | No | `8h` | Token expiry. Default: `8h` |
| `PORT` | No | `3000` | HTTP listen port. Default: `3000`. Azure App Service sets `PORT` automatically. |
| `CORS_ORIGINS` | Yes | `https://ekz-me.azurewebsites.net,https://ekz.example.com` | Comma-separated list of allowed frontend origins |
| `DEFAULT_USER_PASSWORD` | Yes | (a strong temporary password) | Default password assigned to new users on invite. Users are forced to change it on first login. |
| `SMTP_HOST` | Yes | `mail.smtp2go.com` | SMTP relay hostname |
| `SMTP_PORT` | No | `587` | SMTP port. Default: `587` |
| `SMTP_USER` | Yes | `dimpified` | SMTP username |
| `SMTP_PASS` | Yes | (credential) | SMTP password |
| `SMTP_FROM` | No | `hello@dimpified.com` | Sender email address. Default: `hello@dimpified.com` |

**Security recommendations:**
- Store `JWT_SECRET`, `DATABASE_URL`, `SMTP_PASS`, and `DEFAULT_USER_PASSWORD` in **Azure Key Vault**
  and reference them via `@Microsoft.KeyVault(...)` syntax in App Service Configuration
- Never commit secrets to the repository

---

## 4. Build & Start Commands

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build (compiles TypeScript to dist/)
pnpm run build

# Start production server
pnpm run start:prod
# Equivalent to: node dist/main.js
```

**For Azure App Service startup command:**
```
pnpm run start:prod
```

Or if using the raw node command:
```
node dist/main.js
```

---

## 5. Database Initialisation

### 5.1 Migrations (automatic)

Migrations run **automatically on application startup** (`migrationsRun: true` in TypeORM config).
No manual migration step is needed. The app will:

1. Connect to PostgreSQL
2. Check the `migrations` table for already-applied migrations
3. Run any pending migrations in order
4. Then start accepting HTTP requests

There are 6 migrations that create all tables:

| # | Migration | Creates |
|---|-----------|---------|
| 0 | `InitExtensionAndUsers` | `uuid-ossp` extension, `users` table |
| 1 | `LogframeIndicators` | `logframe_nodes`, `indicators`, `indicator_progress` |
| 2 | `FormsSubmissionsLocations` | `forms`, `project_locations`, `submissions` |
| 3 | `AlertsAuditLog` | `alerts`, `audit_log` |
| 4 | `AdminTokensReports` | `api_tokens`, `reports` |
| 5 | `UserDefaultPasswordFlag` | Adds `is_default_password` column to `users` |

### 5.2 Seed Data (manual, one-time)

After the first deployment, run the seed script to create the initial admin user:

```bash
pnpm run seed
```

This creates:
- Email: `admin@ekz.com`
- Name: `Adebola Johnson`
- Password: `Admin123!`
- Role: `admin`

The seed is idempotent — running it again skips existing users.

**Note:** The seed script requires `DATABASE_URL` to be set in the environment.

---

## 6. Database Schema Summary

10 tables total. All primary keys are UUID v4.

```
users
  ├── forms (created_by → users.id)
  ├── submissions (officer_id → users.id, form_id → forms.id)
  ├── project_locations (created_by → users.id)
  ├── alerts (user_id → users.id)
  └── audit_log (user_id — no FK, for resilience)

logframe_nodes (self-referencing parent_id)
  └── indicators (logframe_level_id → logframe_nodes.id)
       └── indicator_progress (indicator_id → indicators.id)

api_tokens (standalone)
reports (standalone)
```

JSONB columns: `forms.fields`, `submissions.data`, `submissions.location`, `reports.filters`,
`audit_log.before_data`, `audit_log.after_data`

Array columns: `forms.indicator_ids`, `forms.assigned_to`, `project_locations.indicator_ids`,
`indicators.sdg_ids`

---

## 7. Dockerfile (if containerising)

The project does not include a Dockerfile. Here is a recommended one:

```dockerfile
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Note on `bcrypt`:** The `bcrypt` package includes native C++ bindings. The builder and runner
stages must use the same OS/architecture. Alpine works for both stages above. If you see
`Error: Cannot find module '../build/Release/bcrypt_napi'`, rebuild in the runner stage or
switch to `node:22-slim` (Debian-based).

---

## 8. Rate Limiting

- Global: 10 requests per 60 seconds per IP (all routes)
- Login: 5 requests per 60 seconds per IP (`POST /api/auth/login` only)

These are in-memory (default NestJS throttler). For multi-instance deployments, consider
adding a Redis-backed throttler store, but it is not required for initial deployment.

---

## 9. Cron Jobs

The application includes a built-in scheduler (`@nestjs/schedule`) that runs:

| Job | Schedule | What it does |
|-----|----------|--------------|
| Deadline check | Daily at 08:00 server time | Checks all indicators for overdue progress reporting and creates in-app alerts for admin/ME staff |

**Important:** At least one instance must be running at all times for the cron to fire.
If using multiple instances, the cron will run on every instance — this is safe (alerts are
idempotent by nature) but produces duplicate alerts. For production with multiple instances,
consider adding a distributed lock (e.g., `pg_advisory_lock`) or running the scheduler on
only one instance.

---

## 10. Authentication

Two authentication mechanisms:

1. **JWT (primary)** — Human users authenticate via `POST /api/auth/login` and receive a Bearer token.
   All routes except `/api/auth/login` and `/api/health` require a valid JWT.

2. **API Tokens (service-to-service)** — Machine clients use tokens created via `POST /api/api-tokens`.
   Format: `Bearer ekz_LIVE_<32 hex chars>`. Currently accepted on submission endpoints only
   (`POST /api/submissions`, `POST /api/submissions/batch`).

---

## 11. CORS

CORS is configured via the `CORS_ORIGINS` environment variable. Set it to the exact origin(s)
of the frontend application (comma-separated, no trailing slashes):

```
CORS_ORIGINS=https://ekz-frontend.azurewebsites.net
```

Credentials (cookies, Authorization header) are allowed.

---

## 12. Monitoring & Observability

### Health Check
- Endpoint: `GET /api/health`
- No authentication required
- Returns: `{ "status": "ok", "timestamp": "2026-04-16T..." }`
- Use this for Azure App Service health probes and load balancer checks

### Logs
- The application logs to stdout/stderr (NestJS default Logger)
- Azure App Service captures these automatically in Log Stream and Application Insights (if enabled)
- Email send failures are logged as errors with full stack traces
- The scheduler logs start/completion of each deadline check run

### Audit Trail
- Every data mutation is recorded in the `audit_log` table
- Accessible via `GET /api/audit-log` (admin only)
- Includes before/after data snapshots for all create/update/delete operations

---

## 13. Backup Recommendations

- Enable Azure automated backups for PostgreSQL Flexible Server (daily, 7-day retention minimum)
- The `audit_log` and `submissions` tables will grow the fastest — monitor storage usage
- Consider enabling point-in-time restore (PITR) for the database

---

## 14. Post-Deployment Verification Checklist

After deployment, verify these in order:

1. `GET /api/health` returns `200 { status: "ok" }` — confirms app is running
2. `GET /api/docs` loads Swagger UI — confirms routing works
3. `POST /api/auth/login` with `admin@ekz.com` / `Admin123!` returns a JWT — confirms DB connection + auth
4. `GET /api/auth/me` with the JWT returns the admin user — confirms JWT validation
5. `GET /api/dashboards/executive` returns KPI data — confirms cross-table queries work
6. Check application logs for `Running deadline check...` around 08:00 — confirms scheduler is active
7. Invite a test user via `POST /api/users/invite` — confirms SMTP is working (user receives welcome email)

---

## 15. Scaling Notes

- The application is stateless — it can be horizontally scaled behind a load balancer
- Session state is in JWT tokens (client-side), not server-side
- The only stateful concern is the cron scheduler (see Section 9)
- Database connection pooling: TypeORM uses a default pool of 10 connections. For higher load,
  set `extra: { max: 20 }` in the TypeORM config or use Azure's PgBouncer (built into Flexible Server)
