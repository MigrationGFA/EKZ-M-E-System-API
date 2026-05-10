# EKZ M&E — Audit Findings: Gaps, TODOs & Risk Areas

Captured during codebase audit on 2026-05-07. Nothing here has been changed yet — this is a punch list to be triaged and scheduled.

Severity legend:
- **Critical** — exploitable in production today, or causes data loss / outage.
- **High** — significant correctness, security, or scalability problem; fix before next release.
- **Medium** — meaningful tech debt; will bite as scale or team grows.
- **Low** — cosmetic, documentation, or minor cleanup.

---

## 1. Security & Secrets

### 1.1 Production secrets committed to the repo — **Critical**
**Where:** [ekz-server/.env](ekz-server/.env)

The file currently contains:
- A live Neon Postgres connection string with username + password
- SMTP host, user, and **plaintext password** (value redacted; rotate)
- Azure Storage account name + **full account key**
- `JWT_SECRET` set to a default-looking placeholder value (rotate)
- `DEFAULT_USER_PASSWORD` set to a known weak value (rotate)

**Why it matters:** Anyone with read access to the repo (or a clone, or git history on a forked branch) has full DB write, full Azure Blob write/delete, and full SMTP send capability under the project's identity. `JWT_SECRET` exposure means anyone can mint admin tokens.

**Remediation:**
1. Rotate every credential listed: DB password, SMTP password, Azure account key, JWT secret, default user password.
2. Remove `.env` from git history (`git filter-repo` or BFG; force-pushing a rewritten history is necessary).
3. Confirm `ekz-server/.env` is in `.gitignore` (the frontend's `.env.local` already is — verify the server side).
4. Replace with `.env.example` containing only key names.
5. Use a secrets manager (Azure Key Vault, doppler, 1Password CLI) for real values.

### 1.2 `JWT_SECRET` looks like a default — **Critical** (subset of 1.1)
**Where:** [ekz-server/.env:3](ekz-server/.env#L3)

The configured value (since redacted from this document) read like a placeholder that was never replaced. Combined with 1.1 (committed to repo), this allowed any reader to forge tokens for any role.

**Remediation:** Generate a fresh 256-bit random secret per environment.

### 1.3 `ekz-auth` cookie is not HttpOnly and is client-asserted — **High**
**Where:** [ekz/stores/authStore.ts:19-27](ekz/stores/authStore.ts#L19-L27), [ekz/middleware.ts:44-54](ekz/middleware.ts#L44-L54)

The cookie is set from JavaScript with `document.cookie` (no `HttpOnly`, no `Secure` unless on HTTPS, `SameSite=Lax`) and stores `{role}` as plain JSON. The Edge middleware trusts that `role` field for prefix-based route gating.

**Why it matters:**
- An attacker with any XSS foothold can read/exfiltrate the cookie freely.
- A user can hand-edit `document.cookie` to set `role=admin` and gain access to the admin SPA shell. The backend API still enforces real auth, so they cannot exfiltrate data — but they can see admin pages render with placeholder UI, which is a spec violation (admin route is supposed to be hidden) and a phishing surface.
- The comment in `authStore.ts` even calls this out: *"Not HttpOnly — this is a convenience bridge, not a security boundary. Real auth will use server-set HttpOnly cookies when the backend is ready."* — the backend is now ready; this TODO has not been done.

**Remediation:** Have the backend set a signed HttpOnly cookie on `/api/auth/login`, OR have the Edge middleware verify the JWT signature itself (using `jose` in Edge runtime) instead of trusting an unsigned client-set role hint.

### 1.4 Local-disk upload fallback is publicly readable — **Medium**
**Where:** [ekz-server/src/main.ts:11](ekz-server/src/main.ts#L11), [ekz-server/src/storage/azure-storage.service.ts:73-94](ekz-server/src/storage/azure-storage.service.ts#L73-L94)

When `AZURE_STORAGE_CONNECTION_STRING` is unset, photos land in `./uploads/submissions/{submissionId}/{fieldId}.jpg`. `app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })` exposes this directory unauthenticated at `/uploads/...`.

**Why it matters:** In a misconfigured prod (Azure env var missing), submission photos — which may include personally identifying images of beneficiaries — become publicly enumerable on the submission UUID. There is no auth check on the static handler.

**Remediation:**
- Refuse to boot if Azure is unconfigured in production (`NODE_ENV=production` && no connection string → fatal).
- Or proxy the static handler behind `JwtAuthGuard`.
- Container disk is also ephemeral, so this fallback is not a real production path anyway.

### 1.5 Forgot-password reset link uses raw token in URL — **Low/Medium**
**Where:** [ekz-server/src/auth/auth.service.ts:104-106](ekz-server/src/auth/auth.service.ts#L104-L106)

`resetLink = "${frontendUrl}/reset-password?token=${rawToken}"`. The token is hashed at rest (good), and has 1h expiry (good), but the raw token in a query string can leak via:
- Referer headers if the reset page renders any third-party assets
- Browser history
- Server logs (if any proxy logs query strings)

**Remediation:** Lower priority — current design is industry-standard. Consider POSTing the token from the reset page after the user lands, but most products live with this.

---

## 2. Auth & Access Control

### 2.1 API tokens cannot actually post submissions — **High** (likely broken feature)
**Where:** [ekz-server/src/api-tokens/api-token.strategy.ts:33-37](ekz-server/src/api-tokens/api-token.strategy.ts#L33-L37), [ekz-server/src/submissions/submissions.controller.ts:79](ekz-server/src/submissions/submissions.controller.ts#L79)

`ApiTokenStrategy.validate()` returns `role: 'api_token'`. But every endpoint that accepts API tokens (e.g. `POST /submissions/batch`) is decorated `@Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)`. `'api_token'` is not in the `UserRole` enum, so [RolesGuard](ekz-server/src/auth/roles.guard.ts#L34) rejects every API-token-authenticated request with 403.

**Why it matters:** The API-token integration path appears non-functional. Either no one has tested it end-to-end, or it was de-scoped silently.

**Remediation:** Decide intent — either:
- Add `UserRole.API_TOKEN` and update `@Roles()` lists for each token-accepting endpoint, OR
- Have the strategy resolve to a real user (e.g. a service account) so role checks pass naturally.

### 2.2 API token validation is O(n) per request — **High** (scaling)
**Where:** [ekz-server/src/api-tokens/api-token.strategy.ts:29-31](ekz-server/src/api-tokens/api-token.strategy.ts#L29-L31)

```ts
const allTokens = await this.tokenRepo.find();
for (const stored of allTokens) {
  const match = await bcrypt.compare(rawToken, stored.token_hash);
```

Every authenticated request loads every token row and bcrypt-compares against each one. With 100 tokens, that's 100 bcrypt operations per request (each ~100ms at default cost factor 10). At cost factor 12 it gets worse.

**Remediation:** The entity already has `token_prefix` (first ~8 chars). Index it, look up by prefix, then bcrypt only the matching candidate(s). Standard pattern for hashed-token lookups.

### 2.3 `JwtAuthGuard` not visible at module level — verify global registration — **Low**
**Where:** [ekz-server/src/auth/auth.module.ts:38-39](ekz-server/src/auth/auth.module.ts#L38-L39)

Both `JwtAuthGuard` and `RolesGuard` are registered as `APP_GUARD`. Confirm `JwtAuthGuard` actually honors `@Public()` (the file wasn't read in this audit) — a missing `@Public()` check there would make `/auth/login` itself unreachable. (If login works, this is fine — just listing it as a thing to verify with a quick test.)

### 2.4 Submission `validate()` accepts arbitrary action strings — **Medium**
**Where:** [ekz-server/src/submissions/submissions.service.ts:341](ekz-server/src/submissions/submissions.service.ts#L341)

```ts
sub.validation_status = action === 'approve' ? 'approved' : 'rejected';
```

Anything that isn't `'approve'` becomes `'rejected'`. The `ValidateSubmissionDto` likely constrains it (not read in this audit), but the service should still defensively reject unknown actions rather than coercing.

**Remediation:** Throw `BadRequestException` if `action` is not one of `'approve' | 'reject'`. Belt-and-braces with the DTO validator.

---

## 3. Performance & Scaling

### 3.1 Geofence is unindexed O(n) per submission — **Medium**
**Where:** [ekz-server/src/submissions/submissions.service.ts:106-110](ekz-server/src/submissions/submissions.service.ts#L106-L110), [ekz-server/src/submissions/helpers/geofence.ts](ekz-server/src/submissions/helpers/geofence.ts)

`locRepo.find()` loads every `ProjectLocation` for every single submission, then iterates and runs Haversine in JS. The batch path is smarter (loads once per batch), but the single-submission `create()` does it per call.

**Why it matters:** Fine at 50 locations × 100 subs/day. Becomes a real cost at 1k+ locations or sustained submission rates. Also doesn't use any spatial index.

**Remediation:**
- Short term: cache `locations` in-memory with a 60s TTL.
- Long term: enable PostGIS, store locations as `GEOGRAPHY(POINT)`, add a GIST index, and let Postgres do `ST_DWithin`.

### 3.2 Photos sent as base64 in JSON body — **Medium**
**Where:** [ekz-server/src/storage/uploads.controller.ts](ekz-server/src/storage/uploads.controller.ts), [ekz/hooks/useSync.ts:36-58](ekz/hooks/useSync.ts#L36-L58)

`POST /api/uploads/image` accepts `{ submissionId, fieldId, base64 }`. The base64 inflates payload by ~33%. NestJS body-parser default limit is 100kb — this will silently fail for any photo larger than ~75kb of original bytes unless the limit was raised (not visible in `main.ts`).

**Remediation:** Either raise the body limit explicitly to a known cap (e.g. 10MB) and document it, or switch to multipart upload with `multer`. Multipart streams to disk/memory without the base64 overhead.

### 3.3 `applyFieldMappings` runs N synchronous indicator updates per approval — **Low**
**Where:** [ekz-server/src/submissions/submissions.service.ts:412-454](ekz-server/src/submissions/submissions.service.ts#L412-L454)

Each mapping triggers a separate `indicatorsService.addProgress()` call, each of which does a fresh load + `latestEntry` query + save + maybe email. For a form with 10 mapped fields, an approval becomes ~30 sequential queries.

**Remediation:** Batch into a single transaction; or accept the cost (approval is a low-frequency action).

### 3.4 Sync interval polls every 15s when online — **Low**
**Where:** [ekz/hooks/useSync.ts:207-209](ekz/hooks/useSync.ts#L207-L209)

`setInterval(performSync, 15000)`. With nothing in the queue this is cheap, but it still wakes up Dexie 4×/min per open tab. Background tabs in field conditions can drain battery.

**Remediation:** Switch to `online` event + Page Visibility API + back off when queue is empty. Already partially done (the function early-returns on empty queue), but the timer keeps firing.

---

## 4. Reliability & Correctness

### 4.1 Migrations auto-run on every boot — **High**
**Where:** [ekz-server/src/app.module.ts:37](ekz-server/src/app.module.ts#L37)

`migrationsRun: true` means a bad migration takes down boot for every replica that restarts. There's no separate migrate step in deploy, no canary, no rollback gate.

**Why it matters:** A blue/green deploy where the new version's migration fails will leave the app crashed-looped, not gracefully rolled back.

**Remediation:** Move migrations to a deploy-time job (CI step or a one-off container that runs `pnpm run migration:run` before swapping traffic). Set `migrationsRun: false` for the app process.

### 4.2 `IndicatorsService.addProgress` has a TOCTOU race — **Medium**
**Where:** [ekz-server/src/indicators/indicators.service.ts:281-292](ekz-server/src/indicators/indicators.service.ts#L281-L292)

```ts
const latestEntry = await this.progressRepo.findOne({
  where: { indicator_id: indicatorId },
  order: { date: 'DESC' },
});
if (latestEntry && latestEntry.id === savedProgress.id) {
  indicator.current_value = dto.value;
  ...
  await this.indicatorRepo.save(indicator);
}
```

Between the `findOne` and the `save`, another concurrent `addProgress` with a later date can land. The earlier writer then overwrites `current_value` with a stale older value.

**Remediation:** Wrap in a transaction with `SELECT ... FOR UPDATE` on the indicator row, or use a single SQL `UPDATE indicators SET current_value = (SELECT value FROM indicator_progress WHERE indicator_id = $1 ORDER BY date DESC LIMIT 1)`.

### 4.3 Stale dead-code branch in `IndicatorsService.remove` — **Low**
**Where:** [ekz-server/src/indicators/indicators.service.ts:175-192](ekz-server/src/indicators/indicators.service.ts#L175-L192)

The `try/catch` exists "for now, just check if the table exists" — comment is stale; the submissions table absolutely exists. The catch swallows real errors.

**Remediation:** Remove the try/catch and let real conflict errors bubble up.

### 4.4 Reports `download_url` is always `"#"` — **Medium**
**Where:** [ekz-server/src/reports/reports.controller.ts:74-75](ekz-server/src/reports/reports.controller.ts#L74-L75)

> "Reports are generated client-side (jsPDF/SheetJS). This endpoint only records the metadata. download_url is always '#'."

**Why it matters:** If a user closes the tab during generation, the artifact is lost forever. The reports list shows entries with non-functional download links — they cannot re-download a report they "generated" yesterday.

**Remediation:** Either generate server-side and persist to Azure Blob, or stop pretending to record reports (drop the metadata table) and treat them as ephemeral exports.

### 4.5 `MSWProvider` blanks the entire app while initializing — **Medium**
**Where:** [ekz/components/providers/MSWProvider.tsx:46](ekz/components/providers/MSWProvider.tsx#L46)

`if (!ready) return null;` — children render nothing until the worker resolves. A misconfigured worker (404 on `/mockServiceWorker.js`, or browser blocks SW) leaves the app permanently blank with no error UI.

**Remediation:** Add a 5s timeout that proceeds without MSW (with a console warning) so a worker failure can never wedge the whole app.

### 4.6 401-on-offline guard relies on `navigator.onLine` — **Low**
**Where:** [ekz/lib/api.ts:25-28](ekz/lib/api.ts#L25-L28)

`navigator.onLine` is famously unreliable — it returns `true` if any network interface is up, even if there's no actual internet. A captive portal or a flaky cell tower can return real 401s that get suppressed.

**Remediation:** Lower priority. The current logic is "good enough" for the field use case; just be aware in debugging.

---

## 5. Frontend Architecture

### 5.1 Two CLAUDE.md files with conflicting info — **Low**
**Where:** [CLAUDE.md](CLAUDE.md), [ekz/CLAUDE.md](ekz/CLAUDE.md)

The frontend one says "Dev server (Turbopack, port 3000)" — actual port is 3001 ([ekz/package.json:6](ekz/package.json#L6)). Root CLAUDE.md is correct. They will continue to drift.

**Remediation:** Delete the frontend CLAUDE.md, keep only the root one.

### 5.2 Zod is a dependency but mostly unused — **Low**
**Where:** [ekz/package.json:40](ekz/package.json#L40)

`zod` and `@hookform/resolvers` are installed; the data-entry page uses inline `register(field.id, { required })` with no schema. Either commit to Zod schemas (better runtime validation, single source of truth with TS types) or drop the deps.

### 5.3 `cacheSessionData` swallows all errors — **Low**
**Where:** [ekz/hooks/useAuth.ts:53-55](ekz/hooks/useAuth.ts#L53-L55)

`catch (err) { console.warn(...) }` — a broken prefetch leaves the user with no offline cache and no surfaced error. Field officers may discover this only when they go offline.

**Remediation:** Surface a non-blocking toast and a retry button.

### 5.4 Photo data URLs land in IndexedDB unmodified — **Medium**
**Where:** [ekz/app/(dashboard)/data-entry/page.tsx:91-100](ekz/app/(dashboard)/data-entry/page.tsx#L91-L100)

Mobile-camera photos are typically 3–8MB. Stored as base64 in Dexie they bloat to ~5–11MB. A field officer who collects 20 forms in a day with 2 photos each fills 100–200MB of IndexedDB. Some browsers cap origin storage; Safari is especially aggressive.

**Remediation:** Resize/compress on capture (canvas → blob, target ~1024px long edge, JPEG 0.85). Drops ~10× in size.

---

## 6. Testing & CI

### 6.1 Backend has effectively no tests — **High**
**Where:** [ekz-server/src/](ekz-server/src/), [ekz-server/test/](ekz-server/test/)

A single `submissions.service.spec.ts` and a boilerplate `app.e2e-spec.ts`. No coverage on auth, indicators, geofence, scheduler, mappings, password reset, role guards.

**Why it matters:** This is a system handling government / donor reporting data. A regression in `applyFieldMappings` silently corrupts indicator history with no detection.

**Remediation (minimum viable):**
- Unit-test `applyGeofence` (the math — straightforward).
- Unit-test `computeStatus`.
- E2E-test the auth flow end-to-end (login → me → change-password).
- E2E-test the submission batch path (offline sync golden path + duplicate idempotency).

### 6.2 Frontend has no tests at all — **Medium**
**Where:** [ekz/](ekz/)

`"No test runner is configured"` in CLAUDE.md. RoleGuard, useSync (the most fragile piece), and the form renderer all have no tests.

**Remediation:** Add Vitest + React Testing Library. Start with `useSync` — it's pure-ish and full of edge cases (retry counts, partial uploads, online/offline transitions).

### 6.3 No CI visible — **Medium**
**Where:** [ekz-server/.github/](ekz-server/.github/) exists but contents unread; root has no `.github/`.

**Remediation:** Confirm there's a CI pipeline running lint + build + (eventually) tests on every PR.

---

## 7. Operational

### 7.1 No structured logging — **Medium**
**Where:** Everywhere; e.g. [ekz-server/src/submissions/submissions.service.ts](ekz-server/src/submissions/submissions.service.ts) uses NestJS `Logger`.

NestJS `Logger` is line-based plaintext. No request IDs, no correlation IDs, no JSON output. Hard to ingest into a log aggregator (Datadog/CloudWatch/ELK).

**Remediation:** Drop in `nestjs-pino` or similar; emit JSON with request-id middleware.

### 7.2 No observability beyond `/api/health` — **Medium**
**Where:** [ekz-server/src/health/health.controller.ts](ekz-server/src/health/health.controller.ts)

`/api/health` returns `{status: 'ok'}` without checking DB connectivity, SMTP, or Azure. A liveness probe will pass while the DB is down.

**Remediation:** Use `@nestjs/terminus` to add real readiness checks (DB ping, Azure ping, SMTP optional).

### 7.3 No rate-limit on `/api/uploads/image` aggregate — **Low**
**Where:** [ekz-server/src/storage/uploads.controller.ts:22](ekz-server/src/storage/uploads.controller.ts#L22)

30 uploads per 60s is per-IP. A single field tablet syncing 100 photos after a long offline stretch hits this and stalls. The frontend doesn't appear to handle 429 specifically (unread).

**Remediation:** Either raise the limit, or implement client-side backoff on 429, or batch multiple photos into one upload call.

---

## 8. Documentation Drift

### 8.1 Stale TODO comments
- [ekz/stores/authStore.ts:21](ekz/stores/authStore.ts#L21) — "Real auth will use server-set HttpOnly cookies when the backend is ready." Backend is ready; comment unfixed (see 1.3).
- [ekz-server/src/indicators/indicators.service.ts:177](ekz-server/src/indicators/indicators.service.ts#L177) — "when submissions table exists" — table exists (see 4.3).
- [ekz/CLAUDE.md:14](ekz/CLAUDE.md#L14) — "port 3000" — actually 3001 (see 5.1).

---

## Suggested Triage Order

If we get one sprint to harden, do these in order:

1. **1.1 / 1.2** — Rotate secrets, scrub git history, gitignore. Day 1, blocking.
2. **1.3** — Move auth to a server-set HttpOnly cookie or sign-verify in middleware.
3. **2.1** — Decide whether API tokens are a real product surface; fix or remove.
4. **2.2** — Token-prefix indexed lookup.
5. **4.1** — Decouple migrations from boot.
6. **6.1** — At minimum, add tests for geofence, computeStatus, and the submission batch endpoint.
7. **5.4** — Compress photos on capture.

Everything else can wait, but it shouldn't wait forever.
