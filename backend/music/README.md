# Person 2 — Music catalog, playlists, streaming

Depends on Person 1: JWT auth, `IsApprovedArtist`, and subscription helpers
(`max_playlists`, `daily_stream_limit`, `can_early_access`, `can_see_stats`, `can_download`).

Swagger UI: http://127.0.0.1:8000/api/docs/

## Rules

- Only an **approved** artist can create/edit/delete albums and songs.
- Audio: MP3 / WAV / FLAC, max 8 MB. Cover: JPG / PNG / WebP, max 2 MB.
- Files are stored under `media/audio/` and `media/covers/`.
- Early-access tracks are visible only when `can_early_access(user)` is true (gold).
- `listener_count` / `stream_count` are `null` for non-gold viewers.
- Playlist caps: basic=6, silver=100, gold=unlimited.
- Daily streams: basic=60 (reset at local midnight), silver/gold unlimited.
- Download: silver and gold only.

## Multipart upload example

Create a single as an approved artist (`Authorization: Bearer <access>`):

```bash
curl -X POST http://127.0.0.1:8000/api/me/songs/ ^
  -H "Authorization: Bearer ACCESS_TOKEN" ^
  -F "title=Midnight Drive" ^
  -F "genre=synthwave" ^
  -F "release_year=2026" ^
  -F "lyrics=City lights in the rearview." ^
  -F "duration_seconds=214" ^
  -F "is_early_access=false" ^
  -F "audio=@C:\path\to\track.mp3;type=audio/mpeg" ^
  -F "cover=@C:\path\to\cover.jpg;type=image/jpeg"
```

Create an album (cover + metadata), then attach tracks with `album=<album_id>` on `POST /api/me/songs/`.

`featured_artist_ids` is a list of approved artist profile IDs (repeat the field in multipart, or send JSON if not uploading files).

## Endpoints

Catalog / home

- `GET /api/home/`
- `GET /api/albums/?q=&sort=`
- `GET /api/albums/{id}/`
- `GET /api/songs/?q=&sort=&singles_only=`
- `GET /api/songs/{id}/`
- `GET /api/artists/{id}/works/`

`sort`: `newest` | `oldest` | `most_listeners` | `most_streams` | `title_asc`

Artist works (approved owner)

- `GET/POST /api/me/albums/`
- `GET/PATCH/DELETE /api/me/albums/{id}/`
- `GET/POST /api/me/songs/`
- `GET/PATCH/DELETE /api/me/songs/{id}/`

Playlists (owner)

- `GET/POST /api/playlists/`
- `GET/PATCH/DELETE /api/playlists/{id}/`
- `POST /api/playlists/{id}/songs/` `{ "song_id": 1 }`
- `DELETE /api/playlists/{id}/songs/{song_id}/`

Playback

- `POST /api/songs/{id}/stream/`
- `GET /api/songs/{id}/download/`

## Tests

```bash
python manage.py test music
```

Covers: approved publish, pending reject, invalid audio, playlist cap, daily stream cap.
