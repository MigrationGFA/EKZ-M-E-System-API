# EKZ M&E Server — Gaps Implementation Plan

This document is a self-contained, phased implementation guide for closing all identified gaps in the
EKZ M&E backend. It is written for an AI coding assistant. Read the entire document before starting
any phase.

---

## Codebase Quick Reference

| Item | Detail |
|------|--------|
| Framework | NestJS v11, TypeScript, ESM (`.js` import extensions in all source files) |
| ORM | TypeORM 0.3.28, PostgreSQL 15 |
| Auth | `JwtAuthGuard` (global, via `APP_GUARD`), `RolesGuard` (global, via `APP_GUARD`) |
| Public routes | Decorated with `@Public()` from `src/auth/public.decorator.ts` |
| Role restriction | Decorated with `@Roles(UserRole.X)` from `src/auth/roles.decorator.ts` |
| Request user | Available as `req.user: { id, email, role }` on any authenticated route |
| Fire-and-forget | Use `void someAsyncCall()` for non-blocking side effects (audit, email) |
| Module imports | `MailModule` is `@Global()` — never import it in feature modules |
| Serialisation | Every service has a private `serialize()` method — never return raw entities |
| Migrations | All schema changes go in `src/database/migrations/` as sequential TypeORM migration files |
| Enum | `UserRole` lives in `src/common/enums/user-role.enum.ts` |

---

## Phase 1 — Critical Bug Fixes

**Goal:** Fix two silent runtime bugs that currently bypass safety guards.

### 1.1 Fix `UsersController` — pass `req.user.id` to `deactivate()` and `updateRole()`

`UsersService.deactivate()` and `UsersService.updateRole()` both accept a `requestingUserId`
parameter to prevent self-modification. The controller never passes it, so the guards silently
receive `undefined` and never fire.

**File:** `src/users/users.controller.ts`

Change the `deactivate` handler:

```typescript
// BEFORE
async deactivate(@Param('id') id: string) {
  const user = await this.usersService.deactivate(id);

// AFTER
async deactivate(@Param('id') id: string, @Request() req: any) {
  const user = await this.usersService.deactivate(id, req.user.id as string);
```

Change the `updateRole` handler:

```typescript
// BEFORE
async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
  const result = await this.usersService.updateRole(id, dto.role);

// AFTER
async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Request() req: any) {
  const result = await this.usersService.updateRole(id, dto.role, req.user.id as string);
```

Add `Request` to the imports from `@nestjs/common` if not already present.

### 1.2 Fix `FormsController` — override `created_by` from JWT, not body

`CreateFormDto` includes a `created_by` field. The controller currently passes the DTO straight to
the service, allowing any user to forge a `created_by` UUID.

**File:** `src/forms/forms.controller.ts`

Read the current `create` handler, then change it to:

```typescript
async create(@Body() dto: CreateFormDto, @Request() req: any) {
  return this.formsService.create({ ...dto, created_by: req.user.id as string });
}
```

Add `@Request() req: any` parameter. Add `Request` to the `@nestjs/common` import.

### 1.3 Fix `LocationsController` — override `created_by` from JWT, not body

Same issue as forms.

**File:** `src/locations/locations.controller.ts`

Read the current `create` handler, then change it:

```typescript
async create(@Body() dto: CreateLocationDto, @Request() req: any) {
  return this.locationsService.create({ ...dto, created_by: req.user.id as string });
}
```

### Acceptance criteria for Phase 1

- Calling `PUT /api/users/:ownId/deactivate` with your own JWT returns `400 Bad Request`
- Calling `PUT /api/users/:ownId/role` with your own JWT returns `400 Bad Request`
- `POST /api/forms` always sets `created_by` to the authenticated user's ID regardless of request body
- `POST /api/locations` always sets `created_by` to the authenticated user's ID regardless of request body

---

## Phase 2 — Missing Endpoints

**Goal:** Add the endpoints that frontend and consumers expect but that do not exist.

### 2.1 Add `GET /api/users/:id`

**File:** `src/users/users.controller.ts`

Add after the existing `findAll` handler:

```typescript
@Get(':id')
@ApiOperation({ summary: 'Get a single user by ID (admin only)' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiResponse({ status: 200, description: 'User object' })
@ApiResponse({ status: 404, description: 'User not found' })
async findOne(@Param('id') id: string) {
  const user = await this.usersService.findById(id);
  if (!user) throw new NotFoundException('User not found');
  return this.usersService.serializeUser(user);
}
```

Add `NotFoundException` to the `@nestjs/common` imports.

### 2.2 Add `GET /api/submissions/:id`

**File:** `src/submissions/submissions.service.ts`

Add the method:

```typescript
async findOne(id: string) {
  const sub = await this.subRepo.findOne({ where: { id } });
  if (!sub) throw new NotFoundException('Submission not found');
  return this.serialize(sub);
}
```

**File:** `src/submissions/submissions.controller.ts`

Add after the `findAll` handler (but before the `batch` route to preserve route order):

```typescript
@Get(':id')
@Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
@ApiOperation({ summary: 'Get a single submission by ID' })
@ApiParam({ name: 'id', description: 'Submission UUID' })
@ApiResponse({ status: 200, description: 'Submission object' })
@ApiResponse({ status: 404, description: 'Submission not found' })
findOne(@Param('id') id: string) {
  return this.submissionsService.findOne(id);
}
```

### 2.3 Add `GET /api/health`

**File:** `src/main.ts`

After `app.setGlobalPrefix('api')` and before the Swagger setup, add a raw Express route so it
responds even before NestJS module initialisation if needed:

```typescript
// Health check — outside global prefix
const server = app.getHttpAdapter().getInstance() as import('express').Application;
server.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
```

Alternatively, create a dedicated controller:

**File:** `src/health/health.controller.ts` (new file)

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

Register it in `AppModule` imports or via a `HealthModule`. The route will be `GET /api/health`.

### 2.4 Verify `DELETE` endpoints exist for Forms and Locations

Read `src/forms/forms.controller.ts` and `src/locations/locations.controller.ts`.

If `DELETE /:id` is missing from either, add it following the same pattern as the existing
`IndicatorsController.remove()` handler (`@Delete(':id')`, `@Roles(UserRole.ADMIN)`,
`@HttpCode(HttpStatus.NO_CONTENT)`).

Both services already have `remove(id)` implemented.

### Acceptance criteria for Phase 2

- `GET /api/users/:id` returns the user object or 404
- `GET /api/submissions/:id` returns the submission or 404
- `GET /health` returns `{ status: 'ok', timestamp }` without a JWT token
- `DELETE /api/forms/:id` returns 204 (admin only)
- `DELETE /api/locations/:id` returns 204 (admin only)

---

## Phase 3 — Pagination Total Count

**Goal:** Every paginated `findAll` response must include `total`, `page`, and `per_page` so
the frontend can render pagination controls.

### 3.1 Standard paginated response shape

All `findAll` methods that accept `page` / `per_page` must return:

```typescript
{
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
```

When `page` and `per_page` are not provided (i.e. fetching all), still wrap in the same shape
with `total: data.length`, `page: 1`, `per_page: data.length`.

### 3.2 Services to update

Update each of the following services. The pattern is the same for all:

1. Before applying `.skip()` / `.take()`, call `qb.getCount()` to get the total.
2. Then apply pagination and call `qb.getMany()`.
3. Return `{ data: serialized, total, page: filters.page ?? 1, per_page: filters.per_page ?? total }`.

**Services:**

| Service file | Method |
|---|---|
| `src/users/users.service.ts` | `findAll()` |
| `src/submissions/submissions.service.ts` | `findAll()` |
| `src/indicators/indicators.service.ts` | `findAll()` |
| `src/alerts/alerts.service.ts` | `findAll()` |
| `src/audit/audit.service.ts` | `findAll()` |

**Example — pattern to apply (using IndicatorsService as template):**

```typescript
async findAll(filters: { ...; page?: number; per_page?: number }) {
  const qb = this.indicatorRepo.createQueryBuilder('i');
  // ... all where clauses ...

  const total = await qb.getCount();

  if (filters.page && filters.per_page) {
    qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
  }

  qb.orderBy('i.created_at', 'DESC');
  const indicators = await qb.getMany();

  return {
    data: indicators.map((i) => this.serialize(i)),
    total,
    page: filters.page ?? 1,
    per_page: filters.per_page ?? total,
  };
}
```

### 3.3 Note on `UsersService.findAll()`

`UsersService.findAll()` has an extra step: it fetches submission counts via a raw query after the
main query. The `total` count must be captured **before** applying `.skip()`/`.take()` on the
QueryBuilder, same as above. The submission count join does not affect the total.

### Acceptance criteria for Phase 3

- `GET /api/users` returns `{ data: [...], total: N, page: 1, per_page: N }`
- `GET /api/users?page=1&per_page=10` returns `{ data: [...], total: N, page: 1, per_page: 10 }`
- `GET /api/indicators`, `GET /api/submissions`, `GET /api/alerts`, `GET /api/audit` all return
  the same shape

---

## Phase 4 — Audit Logging

**Goal:** Every data mutation in the system must produce an audit log entry.

### 4.1 How audit logging works

`AuditService` is defined in `src/audit/audit.service.ts`. It exposes:

```typescript
async log(input: AuditLogInput): Promise<void>
```

Where `AuditLogInput` is:

```typescript
{
  user_id: string;
  user_name: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'submit';
  resource: string;          // e.g. 'indicator', 'form', 'submission'
  resource_id: string;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
}
```

Always call it fire-and-forget: `void this.auditService.log({ ... })`.

### 4.2 Services and methods that need audit calls added

The challenge: most services do not receive the requesting user's identity. There are two options:

**Option A (preferred):** Pass `actorId: string` and `actorName: string` as parameters to service
methods that mutate data.

**Option B:** Pass the full `actor: { id: string; name: string }` object.

Use Option A. Update each method signature and its controller call-site simultaneously.

---

#### `src/indicators/indicators.service.ts`

Import `AuditService` from `../audit/audit.service.js`.
Inject it in the constructor: `private readonly auditService: AuditService`.
Import `AuditModule` in `src/indicators/indicators.module.ts`.

| Method | Action | resource | Notes |
|--------|--------|----------|-------|
| `create(dto, actorId, actorName)` | `create` | `indicator` | `resource_id`: saved.id, `after_data`: serialized result |
| `update(id, dto, actorId, actorName)` | `update` | `indicator` | `before_data`: old serialized, `after_data`: new serialized |
| `addProgress(indicatorId, dto, actorId, actorName)` | `create` | `indicator_progress` | `after_data`: `{ indicatorId, value, date }` |
| `remove(id, actorId, actorName)` | `delete` | `indicator` | `before_data`: serialized before deletion |

Update `src/indicators/indicators.controller.ts` to pass `req.user.id` and `req.user.name` (resolve
name via `UsersService.findById(req.user.id)` or store name in JWT if available — the JWT payload
currently has `{ sub, email, role }` but not `name`; use `email` as fallback for `actorName`).

**Note on actor name:** The JWT payload is `{ sub: userId, email, role }` — no `name`. For audit
calls from controllers, use `req.user.email` as `actorName` unless you can inject `UsersService`
to resolve the full name. Do not inject `UsersService` into services that don't already have it;
use `email` as the name for now.

---

#### `src/forms/forms.service.ts`

Import and inject `AuditService`. Import `AuditModule` in `src/forms/forms.module.ts`.

| Method | Action | resource |
|--------|--------|----------|
| `create(dto, actorId, actorName)` | `create` | `form` |
| `update(id, dto, actorId, actorName)` | `update` | `form` |
| `remove(id, actorId, actorName)` | `delete` | `form` |

---

#### `src/submissions/submissions.service.ts`

`AuditService` is not yet injected here. Import it and add to constructor.
Import `AuditModule` in `src/submissions/submissions.module.ts`.

| Method | Action | resource | Notes |
|--------|--------|----------|-------|
| `create(dto, actorId, actorName)` | `submit` | `submission` | `after_data`: `{ formId, officerId, on_site }` |
| `createBatch(dtos, actorId, actorName)` | `submit` | `submission` | Log once per accepted submission |
| `validate(id, action, actorId, actorName, comment?)` | `update` | `submission` | `before_data`: old status, `after_data`: new status + comment |

Update `src/submissions/submissions.controller.ts` to pass `req.user` to all three methods.

---

#### `src/locations/locations.service.ts`

Import and inject `AuditService`. Import `AuditModule` in `src/locations/locations.module.ts`.

| Method | Action | resource |
|--------|--------|----------|
| `create(dto, actorId, actorName)` | `create` | `location` |
| `update(id, dto, actorId, actorName)` | `update` | `location` |
| `remove(id, actorId, actorName)` | `delete` | `location` |

---

#### `src/api-tokens/api-tokens.service.ts`

Import and inject `AuditService`. Import `AuditModule` in `src/api-tokens/api-tokens.module.ts`.

| Method | Action | resource | Notes |
|--------|--------|----------|-------|
| `create(name, actorId, actorName)` | `create` | `api_token` | `after_data`: `{ name, tokenPrefix }` — never log rawToken or hash |
| `remove(id, actorId, actorName)` | `delete` | `api_token` | `before_data`: `{ name }` |

---

#### `src/reports/reports.service.ts`

Import and inject `AuditService`.

| Method | Action | resource |
|--------|--------|----------|
| `generate(...)` | `create` | `report` |

`generatorEmail` is already passed to this method from the controller; use it as `actorName` and
`generatorId` (pass `req.user.id` from controller) as `actorId`.

---

#### `src/logframe/logframe.service.ts`

Import and inject `AuditService`. Import `AuditModule` in `src/logframe/logframe.module.ts`.

| Method | Action | resource |
|--------|--------|----------|
| `createNode(dto, actorId, actorName)` | `create` | `logframe_node` |
| `updateNode(id, dto, actorId, actorName)` | `update` | `logframe_node` |
| `deleteNode(id, actorId, actorName)` | `delete` | `logframe_node` |
| `linkIndicator(nodeId, indicatorId, actorId, actorName)` | `update` | `indicator` |
| `unlinkIndicator(nodeId, indicatorId, actorId, actorName)` | `update` | `indicator` |

### Acceptance criteria for Phase 4

- Every `POST`, `PUT`, `DELETE` request to any domain endpoint produces a row in the `audit_log` table
- `GET /api/audit` returns entries for indicator creation, form update, submission validation, etc.
- No audit entry contains `password_hash`, `token_hash`, or any raw credential

---

## Phase 5 — In-App Alert Generation

**Goal:** The `alerts` table must be populated automatically. Currently `AlertsService.create()`
exists but nothing calls it.

### 5.1 Wire `AlertsService.create()` into existing flows

#### `data_flag` alert — off-site submission

**File:** `src/submissions/submissions.service.ts`

In the `notifyOffSite()` private method (and the equivalent batch path), after sending the email,
also create an in-app alert for each admin/me_staff user:

```typescript
private async notifyOffSite(submissionId: string, officerId: string): Promise<void> {
  const admins = await this.usersService.findAdminAndMeStaff();
  if (admins.length === 0) return;

  const officer = await this.usersService.findById(officerId);
  const officerName = officer?.name ?? officerId;

  void this.mailService.sendOffSiteAlert(admins.map(u => u.email), submissionId, officerName);

  // Create in-app alert for each admin/me_staff
  for (const admin of admins) {
    void this.alertsService.create({
      user_id: admin.id,
      user_email: admin.email,
      title: 'Off-Site Submission Detected',
      description: `Submission ${submissionId} was recorded outside all project geofences. Officer: ${officerName}.`,
      type: 'data_flag',
    });
  }
}
```

Inject `AlertsService` into `SubmissionsService`. Add `AlertsModule` to `SubmissionsModule.imports`.

**Circular dependency check:** `AlertsModule` → (nothing problematic). `SubmissionsModule` → `AlertsModule` is safe.

---

#### `missed_target` alert — indicator status degradation

**File:** `src/indicators/indicators.service.ts`

In `notifyStatusChangeIfNeeded()`, after sending the email, also create in-app alerts:

```typescript
private notifyStatusChangeIfNeeded(oldStatus: string, newStatus: string, name: string, code: string): void {
  if (newStatus === oldStatus) return;
  if (!['at_risk', 'off_track'].includes(newStatus)) return;

  void this.usersService.findAdminAndMeStaff().then(async (admins) => {
    const emails = admins.map(u => u.email);
    if (emails.length === 0) return;

    void this.mailService.sendIndicatorStatusAlert(emails, name, code, newStatus);

    const title = `Indicator ${newStatus === 'off_track' ? 'Off Track' : 'At Risk'}: ${code}`;
    const description = `"${name}" has moved to ${newStatus}. Review and take corrective action.`;

    for (const admin of admins) {
      void this.alertsService.create({
        user_id: admin.id,
        user_email: admin.email,
        title,
        description,
        type: 'missed_target',
      });
    }
  });
}
```

Inject `AlertsService` into `IndicatorsService`. Add `AlertsModule` to `IndicatorsModule.imports`.

---

#### `sync_success` alert — successful submission

**File:** `src/submissions/submissions.service.ts`

After a single submission is saved in `create()`, create a `sync_success` alert for the officer:

```typescript
const officer = await this.usersService.findById(dto.officerId);
if (officer) {
  void this.alertsService.create({
    user_id: officer.id,
    user_email: officer.email,
    title: 'Submission Synced',
    description: `Your submission for form ${dto.formId} was received and recorded successfully.`,
    type: 'sync_success',
  });
}
```

For `createBatch()`, send one `sync_success` per unique officer in the accepted list.

---

### 5.2 Add scheduled jobs for `deadline` alerts

**Goal:** Notify users with upcoming indicator reporting deadlines.

**New dependency:**

```bash
pnpm add @nestjs/schedule
```

Register in `AppModule`:

```typescript
import { ScheduleModule } from '@nestjs/schedule';
// in imports array:
ScheduleModule.forRoot(),
```

**New file:** `src/scheduler/scheduler.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service.js';
import { IndicatorsModule } from '../indicators/indicators.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [IndicatorsModule, AlertsModule, UsersModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
```

**New file:** `src/scheduler/scheduler.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    private readonly alertsService: AlertsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Runs daily at 08:00. Checks for indicators whose reporting is overdue
   * based on frequency (monthly, quarterly, bi_annually, annually) and the
   * last progress entry date. Notifies all admin/me_staff users.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDeadlines(): Promise<void> {
    this.logger.log('Running deadline check...');

    const now = new Date();
    const indicators = await this.indicatorRepo.find();
    const recipients = await this.usersService.findAdminAndMeStaff();
    if (recipients.length === 0) return;

    const overdueThresholds: Record<string, number> = {
      monthly: 30,
      quarterly: 90,
      bi_annually: 180,
      annually: 365,
    };

    // Get the most recent progress date per indicator from the DB
    const lastProgressRows: { indicator_id: string; last_date: Date }[] =
      await this.indicatorRepo.manager.query(`
        SELECT indicator_id, MAX(date) as last_date
        FROM indicator_progress
        GROUP BY indicator_id
      `);

    const lastProgressMap = new Map(
      lastProgressRows.map((r) => [r.indicator_id, new Date(r.last_date)]),
    );

    for (const indicator of indicators) {
      const threshold = overdueThresholds[indicator.frequency];
      if (!threshold) continue;

      const lastDate = lastProgressMap.get(indicator.id);
      const daysSinceLastEntry = lastDate
        ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000)
        : Infinity;

      if (daysSinceLastEntry >= threshold) {
        for (const recipient of recipients) {
          void this.alertsService.create({
            user_id: recipient.id,
            user_email: recipient.email,
            title: `Reporting Overdue: ${indicator.code}`,
            description: `Indicator "${indicator.name}" (${indicator.frequency}) has not been updated in ${daysSinceLastEntry === Infinity ? 'a long time' : `${daysSinceLastEntry} days`}. A progress entry is overdue.`,
            type: 'deadline',
          });
        }
      }
    }

    this.logger.log('Deadline check complete.');
  }
}
```

Add `SchedulerModule` to `AppModule.imports` and add `TypeOrmModule.forFeature([Indicator])` to
`SchedulerModule` imports (or rely on `IndicatorsModule` exporting `TypeOrmModule`).

### Acceptance criteria for Phase 5

- After a submission is created, the submitting officer has a `sync_success` alert in `GET /api/alerts`
- After an off-site submission, all admins/me_staff have a `data_flag` alert
- After indicator status degrades, all admins/me_staff have a `missed_target` alert
- Running the scheduler manually (call `schedulerService.checkDeadlines()`) creates `deadline` alerts for overdue indicators
- Alerts are visible in `GET /api/alerts?type=data_flag`, `GET /api/alerts?type=missed_target`, etc.

---

## Phase 6 — API Token Validation

**Goal:** Tokens created by `POST /api/api-tokens` must actually authenticate incoming requests.

### 6.1 Create the API token Passport strategy

**New file:** `src/api-tokens/api-token.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { ApiToken } from './api-token.entity.js';

@Injectable()
export class ApiTokenStrategy extends PassportStrategy(Strategy, 'api-token') {
  constructor(
    @InjectRepository(ApiToken)
    private readonly tokenRepo: Repository<ApiToken>,
  ) {
    super();
  }

  async validate(req: Request): Promise<{ id: string; role: string }> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ekz_LIVE_')) {
      throw new UnauthorizedException('Invalid API token');
    }

    const rawToken = authHeader.slice(7); // strip 'Bearer '

    // Must compare against all stored hashes — bcrypt.compare is O(n tokens)
    // For production with many tokens, consider a prefix-based lookup first
    const allTokens = await this.tokenRepo.find();
    for (const stored of allTokens) {
      const match = await bcrypt.compare(rawToken, stored.token_hash);
      if (match) {
        // Return a synthetic "user" object that satisfies RolesGuard
        return { id: stored.id, role: 'api_token' };
      }
    }

    throw new UnauthorizedException('Invalid API token');
  }
}
```

Install `passport-custom` if not already present:

```bash
pnpm add passport-custom
pnpm add -D @types/passport-custom
```

### 6.2 Create the API token guard

**New file:** `src/api-tokens/api-token-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiTokenAuthGuard extends AuthGuard('api-token') {}
```

### 6.3 Create a combined guard (JWT or API token)

For routes that should accept both human JWT users and machine API tokens:

**New file:** `src/auth/jwt-or-api-token.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrApiTokenGuard extends AuthGuard(['jwt', 'api-token']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

### 6.4 Register the strategy

**File:** `src/api-tokens/api-tokens.module.ts`

Add `ApiTokenStrategy` to `providers` and add `PassportModule` to `imports`:

```typescript
import { PassportModule } from '@nestjs/passport';
import { ApiTokenStrategy } from './api-token.strategy.js';

@Module({
  imports: [TypeOrmModule.forFeature([ApiToken]), UsersModule, PassportModule],
  providers: [ApiTokensService, ApiTokenStrategy],
  ...
})
```

### 6.5 Apply the guard where needed

For any route that service-to-service integrations will call (e.g. batch submissions endpoint),
replace the implicit `JwtAuthGuard` (which is global) with an explicit `@UseGuards(JwtOrApiTokenGuard)`.

Routes most likely used by external systems:
- `POST /api/submissions/batch`
- `POST /api/submissions`

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtOrApiTokenGuard } from '../../auth/jwt-or-api-token.guard.js';

@Post('batch')
@UseGuards(JwtOrApiTokenGuard)
createBatch(@Body() dtos: CreateSubmissionDto[]) { ... }
```

### Acceptance criteria for Phase 6

- `POST /api/submissions/batch` with a valid `Authorization: Bearer ekz_LIVE_...` token returns 200
- `POST /api/submissions/batch` with an invalid token returns 401
- `POST /api/submissions/batch` with a revoked token (deleted from DB) returns 401
- JWT tokens still work on the same routes (backwards-compatible)

---

## Phase 7 — Business Logic Correctness

**Goal:** Fix data integrity issues that silently corrupt production data.

### 7.1 Fix indicator `current_value` being overwritten by out-of-order progress entries

**File:** `src/indicators/indicators.service.ts` — `addProgress()` method

Currently the method unconditionally sets `indicator.current_value = dto.value`. This is wrong if
a stale offline sync entry arrives after a newer one.

Fix: only update `current_value` and recompute `status` if the new entry's date is the most recent:

```typescript
async addProgress(indicatorId: string, dto: CreateProgressDto) {
  const indicator = await this.indicatorRepo.findOne({ where: { id: indicatorId } });
  if (!indicator) throw new NotFoundException('Indicator not found');

  const oldStatus = indicator.status;

  const progress = this.progressRepo.create({
    indicator_id: indicatorId,
    value: dto.value,
    date: new Date(dto.date),
    notes: dto.notes ?? null,
    submitted_by: dto.submittedBy,
  });
  const savedProgress = await this.progressRepo.save(progress);

  // Only update current_value if this entry is the most recent by date
  const latestEntry = await this.progressRepo.findOne({
    where: { indicator_id: indicatorId },
    order: { date: 'DESC' },
  });

  if (latestEntry && latestEntry.id === savedProgress.id) {
    indicator.current_value = dto.value;
    indicator.status = computeStatus(Number(dto.value), Number(indicator.target));
    await this.indicatorRepo.save(indicator);

    this.notifyStatusChangeIfNeeded(oldStatus, indicator.status, indicator.name, indicator.code);
  }

  return {
    id: savedProgress.id,
    indicatorId: indicator.id,
    value: Number(savedProgress.value),
    date: savedProgress.date,
    notes: savedProgress.notes,
    submittedBy: savedProgress.submitted_by,
  };
}
```

### 7.2 Fix `dashboard.pending_sync` hardcoded to `0`

**File:** `src/dashboard/dashboard.service.ts` — `getExecutive()` method

Replace `pending_sync: 0` with the actual count of submissions that have not yet been validated:

```typescript
const pendingSync = await this.subRepo.count({
  where: { validation_status: 'pending' },
});

// Then in kpis:
const kpis = {
  ...
  pending_sync: pendingSync,
};
```

### Acceptance criteria for Phase 7

- Adding a progress entry with an older date than the current latest does not change `current_value`
- Adding a progress entry with a newer date does update `current_value`
- `GET /api/dashboard/executive` returns a non-zero `pending_sync` when there are pending submissions

---

## Phase 8 — Response Consistency

**Goal:** Standardise serialised response shapes across all services.

### 8.1 Standardise date field naming

All serialised objects must use `camelCase` for date fields consistently:

| Current (mixed) | Target |
|-----------------|--------|
| `created_at` in some, `createdAt` in others | `createdAt` everywhere |
| `updated_at` | `updatedAt` |
| `submitted_at` | `submittedAt` |
| `validation_status` | keep as-is (it's a domain status value, not a date) |

Check every `serialize()` / `serializeUser()` private method in every service and standardise.
The `Submission` serializer currently mixes both — fix it.

### 8.2 Standardise `serializeUser` to include `created_at`

**File:** `src/users/users.service.ts` — `serializeUser()` method

Add `createdAt: u.created_at` to the returned object so individual user operations (reactivate,
deactivate, updateRole) return the same shape as the list endpoint.

### Acceptance criteria for Phase 8

- All `createdAt`, `updatedAt` fields are camelCase across all API responses
- The response shape from `PUT /api/users/:id/reactivate` matches the shape from `GET /api/users/:id`

---

## Migration Required for Phase 5 (Scheduler)

Phase 5 introduces no new database tables — `alerts` table already exists with all required columns.
No migration needed.

Phase 6 introduces no new tables — `api_tokens` table already exists.

No new migrations are required for any phase in this plan.

---

## Summary Table

| Phase | What it fixes | Files touched |
|-------|---------------|---------------|
| 1 | Silent safety guard bypass + created_by forgery | `users.controller.ts`, `forms.controller.ts`, `locations.controller.ts` |
| 2 | Missing endpoints (GET single user/submission, health, DELETE) | `users.controller.ts`, `submissions.controller.ts`, `forms.controller.ts`, `locations.controller.ts`, `main.ts` |
| 3 | Pagination without total count | All 5 `findAll` service methods + their controllers |
| 4 | Audit logging in 80% of services | All service files + their modules (AuditModule import) |
| 5 | Alert system never fires + no cron jobs | `submissions.service.ts`, `indicators.service.ts`, new `SchedulerModule` |
| 6 | API tokens are decorative (never validated) | New `api-token.strategy.ts`, `api-token-auth.guard.ts`, `jwt-or-api-token.guard.ts` |
| 7 | Data integrity (stale progress, fake pending_sync) | `indicators.service.ts`, `dashboard.service.ts` |
| 8 | Inconsistent response shapes | All `serialize()` methods |

---

## Key Rules for the AI Implementing This

1. **Never change working logic** — only add to it. Do not refactor code that is not in scope for the phase.
2. **Always use `.js` extensions** in all import paths (e.g. `import { X } from './x.service.js'`).
3. **Never return raw TypeORM entities** — always go through the `serialize()` method.
4. **All side effects are fire-and-forget** — `void this.auditService.log(...)`, `void this.mailService.sendX(...)`, `void this.alertsService.create(...)`.
5. **`MailModule` is `@Global()`** — never add it to a feature module's `imports` array.
6. **Test each phase independently** — start the dev server after each phase and verify the acceptance criteria before moving to the next.
7. **No new migrations are needed** for any phase in this plan.
8. **Run `pnpm run build` after every phase** to catch TypeScript errors early.
