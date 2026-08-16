# Mock Spotify — Phase 1 Manual Testing Guide

English manual QA guide for the **Web Programming S2026** Phase 1 project. Use alongside:

- `information/چک_لیست_فاز_اول.md` (Persian checklist, 3-person split)
- `information/WP-PROJ-S2026.pdf` (official course spec, sections 2.1–2.11)

---

## 1. Before you start

### Run the app

```bash
cd "path-to-web-project"
npm install
npm run dev
```

Open **http://localhost:3000**

### Automated checks (run before manual QA)

```bash
npm run test    # 55 tests
npm run build   # production build must pass
```

### Fresh seed data

Data lives in **localStorage**. To reset:

1. DevTools → **Application** → **Local Storage** → delete `mock_spotify_data`
2. Refresh the page

### Demo accounts (password: `123456`)

| Email | Role | Subscription | Use for |
|-------|------|--------------|---------|
| `listener@example.com` | Listener | Silver | Home, playlists, player, notifications |
| `basic@example.com` | Listener | Basic | Playlist limits, avatar lock |
| `artist@example.com` | Artist | Gold | Works upload, catalog |
| `pending@example.com` | Artist (pending) | Basic | Pending approval flow |
| `support@example.com` | Support | Gold | Limited dashboard |
| `admin@example.com` | Admin | Gold | Full dashboard + pricing + analytics |

### Responsive testing

Test at **≥1024px** (desktop), **~768px** (tablet), **~390px** (mobile).

---

## 2. Phase 0 — Shared infrastructure

| Requirement | How to verify |
|-------------|---------------|
| Next.js + TypeScript + Tailwind | App runs; styled UI |
| Folder structure | `app/`, `components/`, `lib/`, `types/`, `hooks/`, `store/` |
| Storage abstraction | Data persists after refresh (`mock_spotify_data` in localStorage) |
| Base UI + layout | Buttons, modals, toasts; Navbar + Sidebar |
| AuthContext | Login persists across navigation |
| Role-based nav | Sidebar links differ per role |

---

## 3. Person 1 — Auth, profile, settings, playlists

### 3.1 Login & registration

| Step | Action | Expected |
|------|--------|----------|
| 1 | `/login` as each role | Listener/artist → `/`; support/admin → `/dashboard` |
| 2 | Forgot password link | `/forgot-password` works |
| 3 | Listener register | Validation on empty/mismatch fields; privacy policy required |
| 4 | Artist register | Redirect to `/register/pending` |
| 5 | `pending@example.com` login | Stays on pending page |

### 3.2 Profile

| Step | Action | Expected |
|------|--------|----------|
| 1 | `/profile` | Name, username, avatar, subscription, followers, **daily streams** |
| 2 | Play a song, revisit profile | Daily stream count **increased** |
| 3 | Other user profile | Follow / unfollow works |
| 4 | `basic@example.com` edit profile | Avatar upload locked |
| 5 | Edit display name | Saves successfully |

### 3.3 Settings

| Step | Action | Expected |
|------|--------|----------|
| 1 | Notification toggles | Turn off e.g. **New releases**; trigger that event → **no new notification** |
| 2 | Language / volume | Saved and applied |
| 3 | **Support** section (listener/artist) | Submit ticket → toast success; staff get notification |
| 4 | Upgrade link | `/payment` shows **admin-configured** Silver/Gold prices |
| 5 | Delete account | Confirmation modal removes account |

### 3.4 Playlists

| Step | Action | Expected |
|------|--------|----------|
| 1 | CRUD playlists | Create, rename, delete |
| 2 | `basic@example.com` | Blocked at 6 playlists |
| 3 | Add songs via `/albums?addTo=` | Songs appear under playlist |
| 4 | Empty library | Empty state + create CTA |

### 3.5 Person 1 automated tests

| Test | File |
|------|------|
| Register validation | `lib/__tests__/register.test.ts` |
| Playlist limits | `lib/__tests__/playlists.test.ts` |
| Follow / unfollow | `lib/__tests__/profile.test.ts` |

---

## 4. Person 2 — Player, library, artist profile

### 4.1 Music player

| Step | Action | Expected |
|------|--------|----------|
| 1 | Play from `/albums` | Desktop bottom bar appears |
| 2 | Controls | Play/pause, next/prev, seek, volume |
| 3 | Repeat ×3, shuffle, queue | All modes work |
| 4 | **Desktop ℹ button** | Panel with **gold stats** + **lyrics** |
| 5 | Mobile | Mini player → fullscreen with lyrics + gold stats |
| 6 | Gold vs basic/silver | Stats hidden for non-gold |

### 4.2 Albums & tracks (`/albums`)

Search, sort, cards, playlist menu with subscription limits.

### 4.3 Artist profile (`/artist/[artistId]`)

Bio, discography, verified badge, gold-only stats, follow button.

### 4.4 Person 2 automated tests

`player-utils.test.ts`, `library.test.ts`, `subscription.test.ts`

---

## 5. Person 3 — Home, notifications, works, dashboard

### 5.1 Home (`/`)

Header, recent playlists (listener), latest albums, popular songs, early access (gold only), sidebar links.

### 5.2 Notifications (`/notifications`)

Unread styling, mark read, mark all, delete, empty state, role-based seed notifications with working links.

**Staff verification link:** click admin notification for new artist → opens `/dashboard/artists/[artistId]`.

### 5.3 Artist works (`/artist/works`)

Upload (FLAC/WAV/MP3), lyrics, cover, single/album, meta fields, stats, edit/delete.

### 5.4 Dashboard

**Support:** artists + tickets only; no finance/pricing/analytics.

**Admin:** + financial audit (confirm settlement), subscription pricing, analytics (pie chart + revenue cards).

**Pricing sync:** change admin prices → check `/payment` and analytics revenue cards update.

### 5.5 Person 3 automated tests

`notifications.test.ts`, `admin.test.ts`, `dashboard.test.ts`, `publish.test.ts`, `notification-preferences.test.ts`, `streaming.test.ts`

---

## 6. Final Phase 1 checklist (PDF §6.1)

| Item | Status |
|------|--------|
| All major pages implemented | Yes — see route list from `npm run build` |
| Role personalization | Yes |
| ≥ 10 frontend tests | **55 tests pass** |
| `npm run build` passes | Yes (`information/` excluded from TypeScript) |
| Responsive layout | Manual — test §1 widths |
| PWA bonus | Not implemented (optional) |
| Phase 2 backend/payment gateway | Out of scope |

---

## 7. Pre-demo smoke test (~15 min)

1. `npm run test` && `npm run build`
2. Reset localStorage → fresh seed
3. Listener: home → play song → profile daily streams ↑
4. Listener: settings → disable notification type → verify suppressed
5. Listener: settings → open support ticket
6. Support: ticket reply + artist approve/reject
7. Admin: finance settlement + pricing + analytics
8. Desktop player **ℹ** → lyrics + gold stats
9. Mobile fullscreen player
10. `/payment` shows live admin prices

---

## 8. Demo script by person

| Person | Demo |
|--------|------|
| Person 1 | Register, profile + streams, settings + support ticket, playlists |
| Person 2 | Albums, full player (desktop details + mobile), artist page |
| Person 3 | Home, notifications, artist works, dashboard (support vs admin) |

---

## 9. Out of scope (Phase 2)

- Real payment gateway (ZarinPal, etc.)
- Django REST backend
- PWA / service worker
- Full i18n copy (language preference is stored; UI strings remain English)

---

*Last updated: July 2026 — Phase 1 localStorage frontend, branch `feature/sam`.*
