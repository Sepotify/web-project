# Phase 2 Plan — Sam (Person 3)

**Repo state when written:** `main` @ `6829e3c` (“phase 2 part 1 added.”)  
**Your Phase 1 areas:** Home, Notifications, Artist works, Support/Admin dashboard  
**This file is gitignored** (`/information`) — local planning only.

---

## 0. What just happened on `main`

Phase 2 part 1 (Person 1 / Mohammad) restructured the repo:

```
web-project/
  backend/     ← NEW Django + DRF (JWT)
  frontend/    ← Phase 1 Next.js app (still 100% localStorage)
```

Backend already has:

| Area | Status |
|------|--------|
| JWT auth (register/login/logout/password reset) | Done |
| Users / me / settings / follow | Done |
| Artist register / approve / reject / pending | Done |
| Notifications CRUD API | Done |
| Subscription model + pricing singleton + capability helpers | Done |
| Avatar multipart upload | Done |
| Swagger at `/api/docs/` | Done |
| Backend tests | **5 only** (need ≥15) |

**Frontend has zero API calls.** AuthContext, notifications, tickets, pricing, analytics, publish — all still hit `frontend/lib/storage.ts`.

Skeleton left for you: `backend/accounts/signals.py` → `subscription_expiry_skeleton` (comment says “for Person 3”).

---

## 1. Phase 2 checklist (PDF §3) — team status

| PDF item | Team status | Your involvement |
|----------|-------------|------------------|
| §3.1 Models + REST CRUD | Partial (accounts only) | You own Song/Album + Tickets (+ reports models) |
| §3.2 Subscriptions | Partial | Wire expiry notify; help payment activate tier |
| §3.3 Access control | Skeleton exists | Apply on your endpoints |
| §3.4 File upload | Avatar only | **Song audio + cover** upload |
| §3.5 User prefs on BE | BE done | Wire FE settings/notifications prefs |
| §3.6 Payment gateway | Not started | Coord with Person 1; refresh UI after pay |
| §3.7 Aggregated reports | Not started (FE still computes) | **You own** analytics/finance/settlements APIs |
| §3.8 FE ↔ BE merge | Not started | Wire *your* pages after shared API client |
| §3.9 Docker (optional) | Not started | Shared / optional |
| ≥15 backend tests | 5/15 | Add tests for everything you build |
| Final report PDF | Not started | Shared — draft your section early |
| Bonus (§5) | Not started | Skip unless spare time |

---

## 2. What remains **for you** (priority order)

### P0 — Blocked on / coordinate with Person 1 first
1. Shared **API client + JWT in AuthContext** (Person 1 should lead; you consume it).
2. Agree branch naming: e.g. `feature/sam-notifications-api`, `feature/sam-tickets`, etc.

### P1 — Your core Phase 2 ownership

| # | Workstream | Backend | Frontend swap |
|---|------------|---------|---------------|
| 1 | **Notifications FE↔BE** | Mostly exists; finish expiry job beyond skeleton | `lib/notifications.ts`, `notification-events.ts`, `notification-sync.ts`, `/notifications` |
| 2 | **Settings prefs wire-up** | `/api/users/me/settings/` exists | `app/settings/page.tsx`, notification prefs |
| 3 | **Admin pricing panel** | `GET/PATCH /api/pricing/` exists | `lib/pricing.ts`, `SubscriptionPricingPanel`, `/payment` prices |
| 4 | **Support tickets** | **New** Ticket + TicketMessage models/APIs | `lib/tickets.ts`, dashboard tickets, Settings form |
| 5 | **Artist works / catalog media** | **New** Song, Album (+ upload) | `lib/publish.ts`, `artist-works/*`, `/artist/works` |
| 6 | **Aggregated reporting** | **New** finance/settlements/analytics endpoints (compute on BE) | `lib/analytics.ts`, `lib/finance.ts`, dashboard pages |
| 7 | **Home aggregates** | Prefer BE endpoints for latest/popular/early-access/recent | `lib/home.ts`, `app/page.tsx` |
| 8 | **Backend tests for your apps** | Aim for **≥8–10** of the team’s 15 | — |

### P2 — Nice / shared
- Docker Compose (if team wants bonus points)
- Help payment callback → subscription active → notify user
- “My tickets” inbox for listeners (Phase 1 gap)

### Explicitly **not** your main lane (unless reassigned)
- Playlist CRUD + player queue APIs → Person 2
- Core JWT/register/login polish → Person 1
- Payment gateway sandbox integration → Person 1 lead

---

## 3. Timeline (suggested ~5 weeks)

Adjust dates to your real deadline. Default assumes **~5 weeks until Phase 2 delivery**.

### Week 1 — Sync + quick wins (notifications & pricing)
**Goal:** Your Phase 1 surfaces talk to existing APIs.

- [x] Pull `main`, run backend (`migrate`, `seed_users`, Swagger)
- [x] Align with team on API client (`fetch` wrapper, token storage, refresh)
- [x] Wire **notifications** page + mark-read / delete / mark-all to `/api/notifications/`
- [x] Wire **settings notification prefs + language/volume** to `/api/users/me/settings/`
- [x] Wire **admin pricing** to `GET/PATCH /api/pricing/`
- [x] Flesh out **subscription expiry** beyond `subscription_expiry_skeleton` (management command or scheduled check on login/sync)
- [x] Add **3–4 backend tests** (notifications + pricing)

**Exit:** Login via JWT (if P1 ready) → notifications & pricing no longer use localStorage for those features.

**Done on branch `feature/sam-week1` (Aug 2026):**
- `frontend/lib/api/client.ts` + `endpoints.ts` — JWT client with refresh
- AuthContext prefers API login; falls back to localStorage if backend is down
- Notifications / settings / pricing / payment wired to Django
- `check_subscription_expiry` management command
- Backend tests: **14** total (was 5)

---

### Week 2 — Tickets API + dashboard chat
**Goal:** Support tickets fully backend-backed.

- [ ] Django app `tickets` (or under `accounts`): `Ticket`, `TicketMessage`
- [ ] Endpoints: create (listener/artist), list (staff), detail, reply, update status
- [ ] Notify staff on create (reuse `notifications.services`)
- [ ] Optional: notify requester on staff reply
- [ ] Swap FE: Settings form + `/dashboard/tickets/*`
- [ ] Tests: create, reply, permissions (listener can’t list all; support can)

**Exit:** Open ticket as listener → appear for support → reply persists in DB.

---

### Week 3 — Music catalog + artist upload
**Goal:** Artist works stop using data-URLs in localStorage.

- [ ] Models: `Song`, `Album` (fields mirroring Phase 1 types)
- [ ] Multipart upload: audio (FLAC/WAV/MP3) + cover (JPG/PNG/WebP)
- [ ] CRUD for approved artists; public/list for discovery (coord with Person 2)
- [ ] Wire `/artist/works` publish/edit/delete to API
- [ ] Trigger `new_release` notifications for followers (BE service)
- [ ] Tests: upload validation, approve-artist-only publish

**Exit:** Publish a track → file on disk / media → visible via API.

---

### Week 4 — Aggregated reports + home
**Goal:** PDF §3.7 — **no heavy aggregation in the frontend**.

- [ ] Endpoints (examples):
  - `GET /api/admin/analytics/subscription-distribution/`
  - `GET /api/admin/analytics/revenue/`
  - `GET /api/admin/finance/settlements/?month=`
  - `POST /api/admin/finance/settlements/{id}/confirm/`
  - Artist work stats: listeners/streams/earnings per song
  - Home: latest albums, popular songs, early access, recent playlists (or Person 2 owns playlists piece)
- [ ] Replace FE `lib/analytics.ts` / `lib/finance.ts` / parts of `lib/home.ts` with display-only fetchers
- [ ] Stream events: decide with team how plays are recorded (needed for real earnings)
- [ ] Tests for report math / permissions (admin-only)

**Exit:** Dashboard analytics/finance numbers come from Django ORM aggregations.

---

### Week 5 — Integration harden + tests + report
**Goal:** Demo-ready and grade checklist green for your parts.

- [ ] End-to-end demo script (your flows on real API)
- [ ] Reach team **≥15 backend tests** (contribute your share)
- [ ] Fix CORS, env docs (`NEXT_PUBLIC_API_URL`), error toasts
- [ ] Write your section of the **final report** (role, structure, AI usage, maintainability)
- [ ] Optional: Docker service for your backend app if team does Compose
- [ ] Optional: listener “My tickets” page

**Exit:** Virtual delivery: your features work against `runserver`, not localStorage.

---

## 4. Week-by-week calendar template

| Week | Dates (fill in) | Focus | Deliverable branch |
|------|-----------------|-------|--------------------|
| 1 | ____ → ____ | Notifications + settings + pricing FE | `feature/sam-notifications-api` |
| 2 | ____ → ____ | Tickets BE+FE | `feature/sam-tickets` |
| 3 | ____ → ____ | Song/Album upload | `feature/sam-catalog` |
| 4 | ____ → ____ | Analytics/finance/home aggregates | `feature/sam-reports` |
| 5 | ____ → ____ | Polish, tests, report draft | `fix/sam-phase2-polish` |

---

## 5. How to run what exists today

### Backend
```bash
cd backend
# create/activate venv, then:
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_users
python manage.py runserver
```
Swagger: http://127.0.0.1:8000/api/docs/

Seed staff passwords come from `.env` (see `backend/README.md`) — not the old Phase 1 `123456`.

### Frontend (still Phase 1 mode)
```bash
cd frontend
npm install
npm run dev
```

Until JWT is wired, FE and BE are **two separate worlds**.

---

## 6. Definition of done (your slice)

You are done for Phase 2 when:

1. Notifications, pricing, tickets, artist works, and admin analytics/finance **do not** depend on `localStorage` for primary data.
2. Song/cover uploads go through Django media (or equivalent), not base64 in JSON.
3. Report endpoints aggregate on the server; FE only displays.
4. You have solid automated tests for tickets, notifications, uploads, and reports.
5. You can demo: artist publish → follower notified; listener opens ticket → staff replies; admin sees BE revenue/distribution; expiry warning fires near subscription end.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Person 1 JWT client delayed | Build BE first; mock FE with Swagger/curl; swap AuthContext when ready |
| Person 2 owns Song list for discovery | Agree model ownership early; one `music` app, shared serializers |
| Stream counts needed for earnings but player is P2 | Define minimal `POST /api/streams/` early in Week 3–4 |
| Scope creep (bonuses) | Skip PWA/crossfade until core §3.1–3.8 green |
| localStorage leftover bugs | Feature-flag or delete storage paths per domain as you migrate |

---

## 8. First actions tomorrow (checklist)

1. [ ] Confirm you’re on `main` and up to date  
2. [ ] Run backend + open Swagger; login as admin from seed  
3. [ ] Message team: who owns API client + when Song model lands  
4. [ ] Create `feature/sam-notifications-api` from `main`  
5. [ ] Fill dates in §4 based on official Phase 2 deadline  

---

## 9. Quick ownership cheat sheet

| You build | Reuse from Person 1 |
|-----------|---------------------|
| Tickets app | JWT + permissions |
| Song/Album + media | `IsApprovedArtist`, media settings |
| Report aggregations | `PricingConfig`, `Subscription` |
| Expiry notify job | `subscription_expiry_skeleton`, `notify_subscription_expiring` |
| FE wiring for home/notifications/works/dashboard | Auth tokens once AuthContext is API-backed |

---

*Last updated: Aug 2026 — after pulling `phase 2 part 1` on `main`.*
