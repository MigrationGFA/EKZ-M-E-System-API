# User Management — Frontend Integration Guide

This document describes the full user management flow as implemented in the backend.
Share this with the frontend team before integration testing.

---

## Overview of changes

- Default password is now configurable via the `DEFAULT_USER_PASSWORD` env var (previously hardcoded). Set this per environment; never reuse across environments.
- New `is_default_password` boolean field added to all user responses
- New endpoint: `POST /api/auth/change-password`
- New endpoint: `PUT /api/users/:id/reset-password`
- New endpoint: `PUT /api/users/:id/reactivate`

---

## User object shape

All endpoints that return a user now include `is_default_password`:

```json
{
  "id": "uuid",
  "email": "user@ekz.com",
  "name": "Grace Okonkwo",
  "role": "me_staff",
  "avatar": null,
  "active": true,
  "is_default_password": true,
  "last_login": "2026-04-10T09:00:00.000Z"
}
```

**`is_default_password`** — `true` means the user has never changed their password (or an admin has just reset it). The frontend should use this to prompt the user to change their password after login.

---

## Auth endpoints

### `POST /api/auth/login`

Public. Rate-limited to 5 requests per 60 seconds.

**Request:**
```json
{ "email": "user@ekz.com", "password": "<DEFAULT_USER_PASSWORD>" }
```

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@ekz.com",
    "name": "Grace Okonkwo",
    "role": "me_staff",
    "avatar": null,
    "is_default_password": true
  },
  "token": "eyJ..."
}
```

**Errors:**
- `401` — invalid credentials or deactivated account
- `429` — too many login attempts

**Frontend flow:** After a successful login, check `user.is_default_password`. If `true`, redirect to the change-password screen before allowing access to the main app.

---

### `GET /api/auth/me`

Requires: Bearer token.

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@ekz.com",
    "name": "Grace Okonkwo",
    "role": "me_staff",
    "avatar": null,
    "is_default_password": false
  }
}
```

**Errors:**
- `401` — missing or invalid token

---

### `POST /api/auth/change-password`

Requires: Bearer token. Any authenticated role.

**Request:**
```json
{
  "current_password": "<DEFAULT_USER_PASSWORD>",
  "new_password": "NewSecure99!"
}
```

**Password rules for `new_password`:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character (e.g. `!@#$%^&*`)

**Response `201`:**
```json
{ "message": "Password updated successfully" }
```

**Errors:**
- `400` — `new_password` fails validation rules (response includes the specific rule message)
- `401` — `current_password` is incorrect

**Side effect:** Sets `is_default_password = false` on the user.

---

## User management endpoints (admin only)

All routes below require: Bearer token + `role: admin`.

### `POST /api/users/invite`

Creates a new user. Password is set to the system default and `is_default_password` is set to `true`.

**Request:**
```json
{
  "name": "Grace Okonkwo",
  "email": "g.okonkwo@ekz.com",
  "role": "me_staff"
}
```

Valid roles: `admin`, `me_staff`, `programme_staff`, `viewer`

**Response `200`:**
```json
{ "message": "User g.okonkwo@ekz.com created successfully" }
```

**Errors:**
- `409` — email already exists

---

### `GET /api/users`

Lists all users. Includes `is_default_password` and `submission_count` per user.

**Query params (all optional):**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by role |
| `search` | string | Search name or email (case-insensitive) |
| `page` | number | Page number (requires `per_page`) |
| `per_page` | number | Items per page (requires `page`) |

Omitting `page`/`per_page` returns all records.

**Response `200`:** Array of user objects (see shape above) with `submission_count` added:
```json
[
  {
    "id": "uuid",
    "email": "user@ekz.com",
    "name": "Grace Okonkwo",
    "role": "me_staff",
    "avatar": null,
    "active": true,
    "is_default_password": true,
    "last_login": null,
    "submission_count": 0
  }
]
```

---

### `PUT /api/users/:id/reset-password`

Resets a user's password back to the system default (the value of `DEFAULT_USER_PASSWORD`).
Sets `is_default_password = true`.

**No request body.**

**Response `200`:**
```json
{ "message": "Password reset to default" }
```

**Errors:**
- `404` — user not found

**Use case:** User forgets their password, admin resets it so they can log in again with the default and then change it.

---

### `PUT /api/users/:id/deactivate`

Deactivates a user. Deactivated users get `401` on login.

**No request body.**

**Response `200`:** Full user object with `active: false`.

**Errors:**
- `404` — user not found

---

### `PUT /api/users/:id/reactivate`

Re-enables a previously deactivated user.

**No request body.**

**Response `200`:** Full user object with `active: true`.

**Errors:**
- `404` — user not found

---

### `PUT /api/users/:id/role`

Updates a user's role.

**Request:**
```json
{ "role": "programme_staff" }
```

**Response `200`:** Full user object with the updated role.

**Errors:**
- `404` — user not found

---

## Recommended frontend flows

### New user first login
```
Login → is_default_password: true → redirect to /change-password
→ POST /api/auth/change-password → success → redirect to /dashboard
```

### Forgot password (field officer calls admin)
```
Admin: PUT /api/users/:id/reset-password
→ is_default_password set to true on their account
User: logs in with the default password → prompted to change password
```

### Reactivate user
```
Admin: PUT /api/users/:id/reactivate
→ user can log in again immediately
```

---

## Notes for field officers (offline mode)

- Token TTL is 8 hours (configurable via `JWT_EXPIRES_IN`).
- There is no refresh token flow — users must re-login after expiry.
- The frontend's existing logic to suppress 401 auto-logout when offline is the correct approach. Tokens are not invalidated server-side before expiry, so a cached token stays valid until its natural expiry even when the device comes back online.
