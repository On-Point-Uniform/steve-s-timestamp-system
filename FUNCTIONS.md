# Backend Functions

This app has **no custom backend functions** (no files under `base44/functions/`).

All data operations are performed directly from the browser using the Base44 SDK client (`src/api/base44Client.js`). These are centralized in:

- `src/api/timestampEvents.js` — all reads/writes to `TimestampEvent`
- `src/api/portalAuth.js` — all reads/writes to `ExternalAuthToken` (portal app) + sessionStorage helpers

## Data Operations Summary

| Operation | Triggered by | What it does |
|-----------|-------------|--------------|
| `listRecentEvents(200)` | Home page mount | Loads last 200 events to restore current session state (phase, session number, break count) |
| `createEvent(record)` | Space Bar press | Persists a new TimestampEvent (Stamp In / Break Start / Break End / Stamp Out) |
| `listAllEvents(5000)` | Database page mount | Loads up to 5,000 events for the audit log table |
| `findValidToken(token)` | `/callback` page mount | Queries the portal app for an unused, unexpired auth token |
| `consumeToken(id)` | `/callback` — after valid token found | Marks the token as used so it cannot be replayed |

## Migration Note

On migration, each function above should become a call to your own REST API endpoint (e.g. `POST /api/events`, `GET /api/events`, `POST /api/auth/verify-token`). The calling components import only from `src/api/timestampEvents.js` and `src/api/portalAuth.js`, so only those two files need to be updated.