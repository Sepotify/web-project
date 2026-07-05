# Mock Spotify

A Spotify clone built with **Next.js + TypeScript + Tailwind CSS** for the Web Programming course (Phase 1).

## Tech Stack

- Next.js 15 (App Router)
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
store/        → AuthContext and global state
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Branch Naming

Use descriptive feature branches:

```
feature/login-page
feature/music-player
fix/playlist-limit
refactor/storage-layer
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix     | Usage                        |
|------------|------------------------------|
| `feat:`    | New feature                  |
| `fix:`     | Bug fix                      |
| `refactor:`| Code change, no new feature  |
| `chore:`   | Tooling, config, dependencies|
| `docs:`    | Documentation only           |
| `test:`    | Adding or updating tests     |

Examples:
```
feat: add login form validation
fix: correct playlist count limit for silver tier
chore: update gitignore
```

## Phase 1 — Team Division

See the internal checklist for the three-person task split (Auth, Music Player, Admin Panel).
