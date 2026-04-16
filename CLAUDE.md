# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install              # Install dependencies
pnpm run start            # Dev server with hot reload (port 3000)
pnpm run start:prod       # Production server (requires built dist/)
pnpm run build            # Compile TypeScript via nest build

pnpm run lint             # ESLint with auto-fix
pnpm run format           # Prettier formatting

pnpm run test             # Unit tests (Jest)
pnpm run test:watch       # Jest watch mode
pnpm run test:cov         # Coverage report
pnpm run test:e2e         # End-to-end tests

pnpm run migration:generate  # Auto-generate TypeORM migration from entity changes
pnpm run migration:run       # Apply pending migrations
pnpm run migration:revert    # Revert last migration
pnpm run seed                # Populate DB with seed data
```

Swagger/OpenAPI docs are served at `/api/docs` (JSON at `/api/docs-json`) when the server is running.

## Architecture

This is a NestJS REST API for an M&E (Monitoring & Evaluation) system. All routes are prefixed with `/api`.

### Domain Modules (`src/`)

| Module | Path | Responsibility |
|--------|------|----------------|
| Auth | `auth/` | JWT login, change-password, `JwtAuthGuard` (global), `RolesGuard`, `@Public()` / `@Roles()` decorators |
| Users | `users/` | CRUD, invite, deactivate/reactivate, role update, admin password reset |
| Logframe | `logframe/` | Hierarchical nodes: Goal → Outcome → Output → Activity |
| Indicators | `indicators/` | KPIs linked to logframe nodes; baseline, target, current value, status |
| Forms | `forms/` | Data collection form definitions with dynamic JSONB `fields` |
| Submissions | `submissions/` | Field data submissions; offline sync, geofencing, validation workflow |
| Locations | `locations/` | Project sites with lat/lng and geofence radius |
| Dashboard | `dashboard/` | Aggregated KPIs: indicator progress, submission counts, sync health |
| Alerts | `alerts/` | User notifications (deadline, missed_target, data_flag, sync_success, system) |
| Audit | `audit/` | System-wide audit trail for all actions; also called by AuthService on login |
| API Tokens | `api-tokens/` | Admin-only token lifecycle for service-to-service auth |
| Reports | `reports/` | Report metadata with download URL, filters (JSONB), format |

### Auth & Authorization

- `JwtAuthGuard` is registered as a global guard via `APP_GUARD` — every route is protected by default.
- Mark public endpoints (only `/auth/login`) with `@Public()`.
- Use `@Roles(UserRole.ADMIN)` to restrict a route to specific roles.
- JWT payload shape: `{ sub: userId, email, role }`.
- Roles: `admin`, `me_staff`, `programme_staff`, `viewer`.

### Database

- PostgreSQL 15+ via TypeORM 0.3.28.
- `migrationsRun: true` — migrations run automatically on app startup.
- `DataSource` for CLI tools is in `src/data-source.ts`.
- Migrations live in `src/database/migrations/` and are sequential (prefixed by timestamp).
- Flexible/dynamic data stored as JSONB: form `fields`, submission `data`, report `filters`.
- All IDs are UUID v4 via `uuid_generate_v4()` (requires the `uuid-ossp` extension, enabled in migration 0).

### User management

- New users are created via `POST /api/users/invite` (admin only) with the default password from `DEFAULT_USER_PASSWORD` env var (fallback: `Password12$`).
- `is_default_password: true` is set on invite and on admin password reset; set to `false` when the user calls `POST /api/auth/change-password`.
- All user responses include `is_default_password` — the frontend uses this to force a password-change prompt.
- `PUT /api/users/:id/reactivate` mirrors the existing `deactivate` endpoint.
- `PUT /api/users/:id/reset-password` resets password to default (admin only); does not return the password.
- See `docs/USER_MANAGEMENT_INTEGRATION.md` for the full frontend integration guide.

### Key Configuration

- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (default 8h), `PORT`, `CORS_ORIGINS`, `DEFAULT_USER_PASSWORD` (default `Password12$`).
- Global rate limit: 10 requests / 60 seconds (configured in `AppModule` via `ThrottlerModule`).
- Global validation pipe with `whitelist: true` and `transform: true` (set in `main.ts`).

### Docs

- `docs/BACKEND_CONTEXT.md` — full domain context: roles, schema details, endpoint specs, offline-sync workflow, real-world M&E context (AfDB-funded, Ekiti State, Nigeria).
- `docs/IMPLEMENTATION_PLAN.md` — phased roadmap with endpoint specifications.
