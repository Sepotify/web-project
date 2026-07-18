# Person 1 — Auth, Users, Artists, Settings, Notifications, Subscription skeleton
#
# Auth strategy: JWT (djangorestframework-simplejwt)
#   - Login/register return { access, refresh }
#   - Logout blacklists the refresh token
#   - Send: Authorization: Bearer <access>
#
## Setup
#
#   cd backend
#   python -m venv ../.venv          # or use repo-root .venv
#   ../.venv/Scripts/pip install -r requirements.txt
#   copy .env.example .env           # Windows
#   python manage.py migrate
#   python manage.py seed_users
#   python manage.py runserver
#
# Swagger UI: http://127.0.0.1:8000/api/docs/
#
## Seed users
#
# | Role    | Email                 | Password (from .env) |
# |---------|-----------------------|----------------------|
# | admin   | admin@example.com     | AdminPass123!        |
# | support | support@example.com   | SupportPass123!      |
#
# Only one admin is allowed system-wide.
#
## Capability helpers (import from subscriptions.services)
#
#   can_upload_avatar(user)   # False for basic
#   max_playlists(user)       # 6 / 100 / None(∞)
#   daily_stream_limit(user)  # 60 / None / None
#   can_see_stats(user)       # gold only
#   can_early_access(user)    # gold only
#   can_download(user)        # silver+gold
#   set_user_tier(user, tier) # admin testing helper
#
## Permission classes (accounts.permissions)
#
#   IsAdmin, IsSupportOrAdmin, IsApprovedArtist, IsOwner, HasSubscriptionCapability
#
## Main endpoints
#
# Auth
#   POST   /api/auth/register/
#   POST   /api/auth/login/
#   POST   /api/auth/logout/                  { "refresh": "..." }
#   POST   /api/auth/password-reset/request/  { "email": "..." }
#   POST   /api/auth/password-reset/confirm/  { "token", "new_password", "confirm_password" }
#
# Users
#   GET/PATCH/DELETE  /api/users/me/
#   GET/PATCH         /api/users/me/settings/
#   GET               /api/users/me/subscription/
#   GET               /api/users/{id}/
#   POST/DELETE       /api/users/{id}/follow/
#   GET               /api/users/{id}/follow-counts/
#
# Artists
#   POST   /api/artists/register/
#   GET    /api/artists/pending/          (support/admin)
#   GET    /api/artists/{id}/
#   POST   /api/artists/{id}/approve/     (support/admin)
#   POST   /api/artists/{id}/reject/      { "reason": "..." }
#   POST/DELETE /api/artists/{id}/follow/
#
# Notifications
#   GET    /api/notifications/            empty list is valid empty state
#   PATCH  /api/notifications/{id}/read/
#   DELETE /api/notifications/{id}/
#   POST   /api/notifications/mark-all-read/
#
# Pricing / admin
#   GET    /api/pricing/
#   PATCH  /api/admin/pricing/                      (admin)
#   PATCH  /api/admin/users/{id}/subscription/      (admin, manual tier)
#
## Tests
#
#   python manage.py test accounts
#
