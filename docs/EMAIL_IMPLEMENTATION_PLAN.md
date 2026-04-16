# Email Notification System — Implementation Plan

**Goal:** Add transactional email notifications across the EKZ M&E backend using Nodemailer + SMTP2Go.  
**Principle:** All email sends are fire-and-forget (`void this.mailService.sendX(...)`) — failures are logged but never block the caller.

---

## Phase 0 — Foundation

> Everything in later phases depends on these tasks. Complete them first, in order.

### Task 1 — Install Nodemailer

```bash
pnpm add nodemailer && pnpm add -D @types/nodemailer
```

### Task 2 — Add SMTP env vars to `.env`

```env
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=dimpified
SMTP_PASS=KDZuLRJrvoASS800
SMTP_FROM=hello@dimpified.com
```

### Task 3 — Create `src/mail/mail.service.ts` (new file)

The **only file that ever touches nodemailer**. Exposes typed `send*()` methods.

All methods call `void this.send(...)` internally — meaning they return synchronously and errors are swallowed + logged. Callers fire-and-forget with `void this.mailService.sendX(...)`.

**Methods to define:**

| Method | Parameters |
|--------|------------|
| `sendWelcome` | `to, name, defaultPassword` |
| `sendPasswordReset` | `to, name, defaultPassword` |
| `sendAccountDeactivated` | `to, name` |
| `sendAccountReactivated` | `to, name` |
| `sendRoleChanged` | `to, name, oldRole, newRole` |
| `sendPasswordChanged` | `to, name` |
| `sendSubmissionApproved` | `to, officerName, submissionId` |
| `sendSubmissionRejected` | `to, officerName, submissionId, comment` |
| `sendOffSiteAlert` | `recipients[], submissionId, officerName` |
| `sendIndicatorStatusAlert` | `recipients[], indicatorName, indicatorCode, newStatus` |
| `sendAlertNotification` | `to, title, description, alertType` |
| `sendReportReady` | `to, generatorName, reportTitle, format` |
| `sendTokenCreated` | `recipients[], tokenName, tokenPrefix` |
| `sendTokenRevoked` | `recipients[], tokenName` |

A private `wrapHtml(title, body)` helper produces the boilerplate HTML wrapper for all emails.

### Task 4 — Create `src/mail/mail.module.ts` (new file)

- Decorated with `@Global()` so `MailService` is available everywhere without re-importing.
- No other module needs to list `MailModule` in their own `imports` (except `AppModule`).

### Task 5 — Register in `src/app.module.ts`

Add `MailModule` to `imports[]`, placed **after** `ConfigModule` and **before** `AuthModule`.

---

## Phase 1 — Add Shared Query to UsersService

### Task 6 — `src/users/users.service.ts`

Add `findAdminAndMeStaff()` — a shared method used by `IndicatorsService` and `ApiTokensService` to fetch admin/me\_staff email recipients.

- Fetches only **active** users
- Selects only `id`, `email`, `name`, `role` columns

---

## Phase 2 — Wire Email Hooks

> Order doesn't matter within this phase. Priority numbers indicate business value ranking.

### Task 7 — `src/users/users.service.ts` (Priority 1 — highest value)

Inject `MailService` (globally provided; no module change needed).

Add `void this.mailService.sendX(...)` calls after each save:

| Method | Email sent |
|--------|------------|
| `invite()` | `sendWelcome` (includes plaintext default password — intentional) |
| `resetPassword()` | `sendPasswordReset` |
| `deactivate()` | `sendAccountDeactivated` |
| `reactivate()` | `sendAccountReactivated` |
| `updateRole()` | `sendRoleChanged` with old + new role |

### Task 8 — `src/auth/auth.service.ts` (Priority 2)

Inject `MailService`.

In `changePassword()`, after save:

```
void this.mailService.sendPasswordChanged(user.email, user.name)
```

### Task 9 — `src/submissions/submissions.module.ts` + `submissions.service.ts` (Priority 3)

**Module:** Add `UsersModule` to `imports` (needed to resolve officer email from `officer_id`).

**Service:** Inject `UsersService` + `MailService`. Add:

| Method | Behaviour |
|--------|-----------|
| `validate()` | Look up officer via `usersService.findById(sub.officer_id)` → call `sendSubmissionApproved` or `sendSubmissionRejected` |
| `create()` | After geo: if `on_site === false` → fetch admins → `sendOffSiteAlert` |
| `createBatch()` | Same pattern, but fetch admins **once** before the loop |

### Task 10 — `src/indicators/indicators.module.ts` + `indicators.service.ts` (Priority 4)

**Module:** Add `UsersModule` to `imports`.

**Service:** Inject `UsersService` + `MailService`.

Extract a private `notifyStatusChangeIfNeeded(oldStatus, newStatus, name, code)` helper to avoid duplicating logic in both `addProgress()` and `update()`.

Only fires when:
```typescript
['at_risk', 'off_track'].includes(newStatus) && newStatus !== oldStatus
```

### Task 11 — `src/alerts/alerts.service.ts` (Priority 5)

Inject `MailService`.

Add an internal `create(dto)` method (not an HTTP endpoint). The DTO accepts `user_email` directly (caller passes it) to avoid injecting `UsersService` and risking a future circular dependency.

Inside `create()`, after saving:

```
void this.mailService.sendAlertNotification(...)
```

### Task 12 — `src/reports/reports.service.ts` + `reports.controller.ts` (Priority 6)

**Service:** Inject `MailService`. Add `generatorEmail: string` as a new parameter to `generate()`.

After save:

```
void this.mailService.sendReportReady(generatorEmail, generatedBy, title, format)
```

**Controller:** Already resolves the requesting user. Pass `requestingUser?.email ?? req.user.email` as the new `generatorEmail` argument.

### Task 13 — `src/api-tokens/api-tokens.module.ts` + `api-tokens.service.ts` (Priority 7)

**Module:** Add `UsersModule` to `imports`.

**Service:** Inject `UsersService` + `MailService`.

| Method | Behaviour |
|--------|-----------|
| After `create()` | Fetch admins → `sendTokenCreated` with masked prefix (**not** `rawToken`) |
| After `remove()` | Fetch admins → `sendTokenRevoked` |

---

## Module Dependency Change Summary

| Module | Change |
|--------|--------|
| `AppModule` | + `MailModule` |
| `SubmissionsModule` | + `UsersModule` |
| `IndicatorsModule` | + `UsersModule` |
| `ApiTokensModule` | + `UsersModule` |
| All others | No change (global resolves `MailService`) |

**No circular dependencies introduced.** `MailModule` depends on nothing. `UsersModule` depends on nothing new.

---

## Test Plan

### Unit Tests — `src/mail/mail.service.spec.ts` (new file)

Mock `nodemailer.createTransport` to return `{ sendMail: jest.fn() }`.

| # | Test case |
|---|-----------|
| 1 | `sendWelcome` — `sendMail` called with correct `to`, subject containing "Welcome", html containing name and default password |
| 2 | `sendPasswordReset` — html contains the default password |
| 3 | `sendPasswordChanged` — html does **not** contain any password value (security check) |
| 4 | `sendRoleChanged` — html contains both `oldRole` and `newRole` strings |
| 5 | `sendSubmissionRejected` — html contains the rejection comment |
| 6 | `sendOffSiteAlert` — `sendMail` receives all recipient emails |
| 7 | `sendIndicatorStatusAlert` — html contains indicator code and `newStatus` |
| 8 | SMTP failure does not throw — mock `sendMail` to reject, call any method, assert no exception thrown and `logger.error` was invoked |
| 9 | Transporter initialised with correct SMTP2Go config values |

---

### Unit Tests — Per-Service Specs

Each service spec mocks `MailService` with all methods as `jest.fn()`.

#### `src/users/users.service.spec.ts`

| # | Test case |
|---|-----------|
| 1 | `invite()` → `sendWelcome` called with correct email, name, and a password string |
| 2 | `invite()` on duplicate email → `sendWelcome` **not** called |
| 3 | `resetPassword()` → `sendPasswordReset` called |
| 4 | `resetPassword()` user not found → `sendPasswordReset` **not** called |
| 5 | `deactivate()` → `sendAccountDeactivated` called |
| 6 | `reactivate()` → `sendAccountReactivated` called |
| 7 | `updateRole()` → `sendRoleChanged` called with both old and new roles |
| 8 | Mail failure in `invite()` does not change the return value |

#### `src/auth/auth.service.spec.ts`

| # | Test case |
|---|-----------|
| 1 | `changePassword()` success → `sendPasswordChanged` called |
| 2 | `changePassword()` wrong current password → `sendPasswordChanged` **not** called |
| 3 | Mail failure does not affect return value `{ message: '...' }` |

#### `src/submissions/submissions.service.spec.ts` (extend existing)

| # | Test case |
|---|-----------|
| 1 | `validate()` approve → `sendSubmissionApproved` called with officer email |
| 2 | `validate()` reject → `sendSubmissionRejected` called with comment |
| 3 | `validate()` approve → `sendSubmissionRejected` **not** called |
| 4 | `validate()` — `usersService.findById` returns null → no mail called, function still returns correctly |
| 5 | `create()` with `on_site: false` → `sendOffSiteAlert` called with admin emails |
| 6 | `create()` with `on_site: true` → `sendOffSiteAlert` **not** called |
| 7 | `create()` with `on_site: null` (no GPS) → `sendOffSiteAlert` **not** called |
| 8 | `createBatch()` with 3 off-site submissions → `findAdminAndMeStaff` called exactly once (not 3×) |
| 9 | `createBatch()` all duplicates → `sendOffSiteAlert` **not** called |
| 10 | Mail failure does not affect `validate()` return value |

#### `src/indicators/indicators.service.spec.ts`

| # | Test case |
|---|-----------|
| 1 | `addProgress()` status `on_track` → `at_risk` → `sendIndicatorStatusAlert` called |
| 2 | `addProgress()` status `on_track` → `off_track` → `sendIndicatorStatusAlert` called |
| 3 | `addProgress()` already `at_risk` → still `at_risk` → `sendIndicatorStatusAlert` **not** called |
| 4 | `addProgress()` `at_risk` → `on_track` (improvement) → `sendIndicatorStatusAlert` **not** called |
| 5 | `update()` changes `current_value` causing `off_track` → `sendIndicatorStatusAlert` called |
| 6 | `update()` no `current_value`/`target` change → `sendIndicatorStatusAlert` **not** called |
| 7 | `findAdminAndMeStaff` returns `[]` → `sendIndicatorStatusAlert` **not** called |
| 8 | Mail failure does not affect `addProgress()` return value |

#### `src/alerts/alerts.service.spec.ts`

| # | Test case |
|---|-----------|
| 1 | `create()` persists alert to repo |
| 2 | `create()` calls `sendAlertNotification` with correct args |
| 3 | `create()` returns saved alert even when mail fails |
| 4 | Existing `markRead` / `markAllRead` behavior unchanged (regression) |

#### `src/reports/reports.service.spec.ts`

| # | Test case |
|---|-----------|
| 1 | `generate()` calls `sendReportReady` with all correct args |
| 2 | Mail failure does not affect `{ report_id, download_url, format }` return |

#### `src/api-tokens/api-tokens.service.spec.ts`

| # | Test case |
|---|-----------|
| 1 | `create()` calls `sendTokenCreated` with admin emails and masked prefix — **not** `rawToken` |
| 2 | `remove()` calls `sendTokenRevoked` with admin emails |
| 3 | No admins found → neither send method called |
| 4 | Mail failure does not affect `create()` return value (`rawToken` still returned) |

---

### E2E Tests — `test/app.e2e-spec.ts` additions

Override `MailService` in the test module so no real SMTP calls are made:

```typescript
.overrideProvider(MailService)
.useValue({ sendWelcome: jest.fn(), /* all methods */ })
```

| # | HTTP call | Assert |
|---|-----------|--------|
| 1 | `POST /api/users/invite` → 200 | `mailService.sendWelcome` spy called once |
| 2 | `PUT /api/users/:id/reset-password` → 200 | `mailService.sendPasswordReset` spy called |
| 3 | `PUT /api/users/:id/deactivate` → 200 | `mailService.sendAccountDeactivated` spy called |
| 4 | `PUT /api/users/:id/reactivate` → 200 | `mailService.sendAccountReactivated` spy called |
| 5 | `POST /api/auth/change-password` → 201 | `mailService.sendPasswordChanged` spy called |
| 6 | `POST /api/reports/generate` → 201 | `mailService.sendReportReady` spy called |
| 7 | `POST /api/users/invite` with `sendWelcome` throwing → still returns 200 | Fire-and-forget confirmed at the HTTP boundary |

---

## Critical Edge Cases

These guards apply across **all** tasks:

| Scenario | Guard |
|----------|-------|
| Officer/user email is `null` | `if (officer)` before calling any mail method |
| `findAdminAndMeStaff()` returns `[]` | `if (emails.length > 0)` before bulk send |
| Status unchanged on update | `newStatus !== oldStatus` guard in indicator helper |
| Batch — duplicate submissions | Off-site email skipped (submission not saved, no email) |
| SMTP constructor failure (bad env) | `createTransport` is lazy in nodemailer — actual failure occurs on first `sendMail`. The `try/catch` in private `send()` handles this |
