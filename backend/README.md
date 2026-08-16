# Backend — Django + DRF (Phase 2)

Person 1 foundation: auth, users, artists, settings, notifications, subscriptions.  
Person 3 (Sam): tickets, reports (analytics/finance). Song/Album uploads live in Person 2 `music`.

## Auth

JWT via `djangorestframework-simplejwt`:

- Login/register return `{ access, refresh }`
- Logout blacklists the refresh token
- Send: `Authorization: Bearer <access>`

## Setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py seed_users
.venv\Scripts\python manage.py runserver
```

Swagger UI: http://127.0.0.1:8000/api/docs/

## Seed users

| Role    | Email                 | Password (from `.env`) |
|---------|-----------------------|------------------------|
| admin   | admin@example.com     | AdminPass123!          |
| support | support@example.com   | SupportPass123!        |

Only one admin is allowed system-wide.

## CORS / frontend

`CORS_ALLOWED_ORIGINS` in `.env` must include the Next.js origin, e.g.:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Frontend uses `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`.

## Capability helpers (`subscriptions.services`)

- `can_upload_avatar(user)` — False for basic
- `max_playlists(user)` — 6 / 100 / None(∞)
- `daily_stream_limit(user)` — 60 / None / None
- `can_see_stats(user)` — gold only
- `can_early_access(user)` — gold only
- `can_download(user)` — silver+gold
- `set_user_tier(user, tier)` — admin testing helper

## Permission classes (`accounts.permissions`)

`IsAdmin`, `IsSupportOrAdmin`, `IsApprovedArtist`, `IsOwner`, `HasSubscriptionCapability`

## Main endpoints

### Auth
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/` `{ "refresh": "..." }`
- `POST /api/auth/password-reset/request/`
- `POST /api/auth/password-reset/confirm/`

### Users
- `GET/PATCH/DELETE /api/users/me/`
- `GET/PATCH /api/users/me/settings/`
- `GET /api/users/me/subscription/`
- `GET /api/users/{id}/`
- `POST/DELETE /api/users/{id}/follow/`

### Artists
- `POST /api/artists/register/`
- `GET /api/artists/pending/` (support/admin)
- `GET /api/artists/{id}/`
- `POST /api/artists/{id}/approve/`
- `POST /api/artists/{id}/reject/`
- `POST/DELETE /api/artists/{id}/follow/`

### Notifications
- `GET /api/notifications/`
- `PATCH /api/notifications/{id}/read/`
- `DELETE /api/notifications/{id}/`
- `POST /api/notifications/mark-all-read/`

### Pricing
- `GET /api/pricing/`
- `PATCH /api/admin/pricing/` (admin)

### Tickets (Person 3)
- `GET/POST /api/tickets/`
- `GET /api/tickets/{id}/`
- `POST /api/tickets/{id}/reply/`
- `PATCH /api/tickets/{id}/status/` (support/admin)

### Catalog / music (Person 2 — use these for works + home)
- `GET /api/home/`
- `GET/POST /api/me/albums/`
- `GET/PATCH/DELETE /api/me/albums/{id}/`
- `GET/POST /api/me/songs/`
- `GET/PATCH/DELETE /api/me/songs/{id}/`
- `POST /api/songs/{id}/stream/`
- See `music/README.md` for search, playlists, download.

### Reports (Person 3)
- `GET /api/admin/analytics/subscription-distribution/` (admin)
- `GET /api/admin/analytics/revenue/` (admin)
- `GET /api/admin/finance/settlements/?month=YYYY-MM` (admin)
- `POST /api/admin/finance/settlements/{id}/confirm/` (admin)

## Tests

```bash
python manage.py test
```

Expect 28+ tests across accounts, notifications, music, tickets, and reports.
