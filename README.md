# Mock Spotify

A Spotify clone built with **Next.js + TypeScript + Tailwind CSS** for the Web Programming course (Phase 1).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Local Storage (no backend in Phase 1)

## Project Structure

```
app/          → Next.js pages and layouts
components/   → Reusable UI and layout components
  ui/         → Button, Input, Card, Modal, Avatar, Badge, EmptyState, Toast
  layout/     → Navbar, Sidebar, AppShell
lib/          → Storage layer, design tokens, utilities
types/        → Shared TypeScript interfaces
hooks/        → Custom React hooks
store/        → AuthContext, PlayerContext, and global state
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

| Role     | Email                 | Password |
|----------|-----------------------|----------|
| Listener | listener@example.com  | 123456   |
| Artist   | artist@example.com    | 123456   |
| Support  | support@example.com   | 123456   |
| Admin    | admin@example.com     | 123456   |

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm test         # Run unit tests
```

## Phase 1 — Team Division

| Member | Name | Area |
|--------|------|------|
| Person 1 | **Mohammad Baniahmandi** | Authentication & User Profile |
| Person 2 | **Alireza Sarbaz** | Music Player & Content Discovery |
| Person 3 | **Sam Khanaki** | Home, Notifications & Admin Dashboard |

---

### Person 1 — Mohammad Baniahmandi
**Authentication & User Profile**

#### 1. Login & Registration (150 pts)
- Shared login form for all 4 roles (email + password)
- Forgot password flow
- Listener registration (display name, email, password, birth date, gender)
- Privacy policy checkbox + modal/page
- Artist registration (email, password, stage name, portfolio)
- Pending approval state for new artists
- Redirect to home after listener signup
- Form validation (email format, password match, required fields)
- Responsive layout (mobile / tablet / desktop)

#### 2. User Profile & Management (150 + 100 pts)
- Display name, username, profile photo (or default)
- Subscription tier (Basic / Silver / Gold)
- Follower and following counts
- Daily stream count
- Follow / unfollow button (for other users' profiles)
- Edit profile modal
- Basic plan restriction: cannot change profile photo (UI lock)

#### 3. App Settings (200 pts)
- Notification preference toggles
- Language switcher (UI + saved preference)
- Default volume settings
- Delete account (with confirmation modal)
- Current subscription display + upgrade button (placeholder link to payment page)

#### 4. Playlists (200 pts)
- Create, delete, rename playlists
- Subscription-based playlist limits (6 / 100 / unlimited)
- Add song to playlist → redirect to albums/tracks page
- Empty state when no playlists exist
- Song cards listed under each playlist

**Suggested tests:** registration validation, playlist limit by subscription, playlist empty state, follow/unfollow button

---

### Person 2 — Alireza Sarbaz
**Music Player & Content Discovery**

#### 1. Music Player (800 pts)
- Audio library integration (`howler.js`)
- Progress bar with drag/seek
- Play, pause, next, previous controls
- Volume slider
- Repeat modes: off / repeat all / repeat one
- Shuffle toggle + queue reorder logic
- Visible queue with remove and reorder
- Cover, artist, and album as clickable links
- Lyrics display when available
- Listener/stream stats for Gold users only
- Desktop: fixed bottom player bar
- Mobile: mini-player + fullscreen expand
- Global player state (persists across page navigation)

#### 2. Albums & Singles (100 pts)
- Search by track or artist name
- Sort/filter by listeners and release date
- Album card: cover, title, artist → links to album/artist pages
- Track card: cover, title, artist, album → links to player/album/artist
- Playlist menu on cards (add/remove) with subscription limits

#### 3. Artist Profile Page (150 pts)
- Artist biography
- Published albums and singles list
- Verified artist badge
- Total listeners/streams stats (Gold users only)
- Follow / unfollow artist button

**Suggested tests:** repeat mode cycling, shuffle queue, album/track search & sort, gold stats visibility by subscription

---

### Person 3 — Sam Khanaki
**Home, Notifications & Admin Dashboard**

#### 1. Home Page (150 pts)
- Header with user display name and profile photo
- Showcase: recently played playlists
- Showcase: latest released albums
- Showcase: most popular tracks
- Early access section (Gold subscribers only)
- Sidebar links to playlists, profile, settings, albums/tracks

#### 2. Notifications (250 pts)
- Visual distinction for unread notifications
- Mark as read button per card
- Delete notification button
- Mark all as read button
- Empty state when no notifications
- Listener logic: subscription expiry + new releases from followed artists
- Artist logic: approval/rejection result + monthly earnings
- Support/Admin logic: new tickets + artist verification requests

#### 3. Artist Works Management (200 pts)
- Audio file upload form (FLAC/WAV/MP3 — file picker only)
- Lyrics input
- Cover image upload
- Release type: single or album
- Metadata: genre, release year, featured artists
- Per-work stats: listeners, streams, earnings
- Edit and delete published works

#### 4. Support & Admin Dashboard (300 pts)
- Role-based sidebar (support has fewer sections than admin)
- Artist verification requests table
- Artist request detail page with Approve/Reject (rejection reason)
- Support tickets table
- Chat-like ticket reply page
- Monthly financial audit table for artists
- Confirm settlement button (admin only)
- Subscription pricing panel (admin only)
- User distribution pie chart by subscription tier (admin only)
- Current month revenue stat cards (admin only)

**Suggested tests:** mark notification as read, approve/reject artist request, support vs admin access, new work upload form

---

## Shared Responsibilities (All Members)

Completed together before and during development:

- Stack selection: Next.js + TypeScript + Tailwind CSS
- Shared GitHub repo + branch naming (`feature/login-page`, etc.)
- Folder structure: `/app`, `/components`, `/lib`, `/types`, `/hooks`, `/store`
- Shared types in `/types`
- Local Storage abstraction layer (`lib/storage.ts`)
- Base UI components: Button, Input, Card, Modal, Avatar, Badge, EmptyState, Toast
- Navbar & Sidebar (desktop + mobile) with role-based navigation
- `AuthContext` for logged-in user and role
- Design tokens (colors, fonts, spacing, radius)
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`)
