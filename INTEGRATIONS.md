# Integrations & Secrets

## Third-Party Services

### 1. Base44 BaaS (this app's own database)

- **Purpose:** Stores all `TimestampEvent` records.
- **Client:** `src/api/base44Client.js` — pre-initialized `base44` SDK instance.
- **Environment variables needed on migration:**
  - `VITE_APP_ID` — Base44 app ID for this app (currently baked into the SDK init via the Base44 Vite plugin).
- **Replacement:** Any REST database (Postgres, MySQL, Supabase, etc.) with a corresponding API layer.

### 2. On Point Portal (external Base44 app — SSO provider)

- **Purpose:** Validates employee identity via one-time PIN tokens.
- **Client:** `src/lib/portalClient.js` — a second Base44 SDK instance targeting app ID `6a5545ad446ace2ec9960075`.
- **Environment variables needed on migration:**
  - `VITE_PORTAL_APP_ID` — currently hardcoded as `6a5545ad446ace2ec9960075`.
  - `VITE_PORTAL_AUTH_URL` — currently hardcoded as `https://on-point-portal.base44.app/auth`.
- **Replacement:** A dedicated auth endpoint (e.g. `/api/auth/verify-portal-token`) that accepts the token and returns the employee identity. Move portal API access server-side to protect credentials.

### 3. xlsx (npm package)

- **Purpose:** Client-side Excel export on the Database/Audit Log page.
- **No secrets required.** Pure client-side library.
- **File:** `src/lib/auditExport.js`

---

## Secrets / Environment Variables Summary

| Variable Name          | Used by               | Where to set            |
|------------------------|-----------------------|-------------------------|
| `VITE_APP_ID`          | Base44 SDK (implicit) | Base44 dashboard / `.env.local` |
| `VITE_PORTAL_APP_ID`   | `src/lib/portalClient.js` | `.env.local` (currently hardcoded) |
| `VITE_PORTAL_AUTH_URL` | `src/pages/StaffLogin.jsx` | `.env.local` (currently hardcoded) |

> **Note:** There are no API keys, Stripe keys, email provider secrets, or file storage secrets in this app.

---

## Base44-Specific Flags

| Item | Description | Migration path |
|------|-------------|----------------|
| `@base44/sdk` `createClient()` | SDK used for both this app's DB and the portal app | Replace with your HTTP client (`fetch`, `axios`, etc.) |
| `@base44/vite-plugin` | Injects app ID, HMR notifications, analytics | Remove from `vite.config.js`; set env vars manually |
| `base44.entities.X` API shape | `.list()`, `.filter()`, `.create()`, `.update()` | Map to REST verbs: GET, GET+query, POST, PATCH |
| `created_date` / `updated_date` / `id` auto-fields | Added by Base44 automatically | Add equivalent auto-fields in your schema/ORM |