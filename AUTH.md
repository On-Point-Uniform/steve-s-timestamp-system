# Authentication

## Login Method

This app uses **Portal SSO** — there is no local login form, no email/password, and no OAuth provider.

### Flow

1. Staff visit `/login` (`src/pages/StaffLogin.jsx`) and click "Sign in with your Employee PIN".
2. They are redirected to `https://on-point-portal.base44.app/auth?app=Steves-Timestamp-System&redirect=<origin>/callback`.
3. The On Point Portal authenticates the employee with their name + PIN.
4. The portal redirects back to `/callback?portal_token=TOKEN&employee_name=NAME`.
5. `/callback` (`src/pages/PortalCallback.jsx`) calls `findValidToken(token)` on the **portal app's** `ExternalAuthToken` entity:
   - Checks `used === false` and `expires_at` has not passed.
   - Calls `consumeToken(id)` to mark the token as used (one-time-use).
   - Saves identity to `sessionStorage` under key `portal_identity`.
6. Staff are redirected to `/` (Home page).

### Identity Object (sessionStorage `portal_identity`)

```json
{
  "employee_name": "Jane Smith",
  "role": "staff",
  "employee_id": "<portal record id>"
}
```

### Session Persistence

- Stored in `sessionStorage` (tab-scoped, cleared on browser close).
- No server-side session or JWT is issued by *this* app.
- "Sign Out" button clears `portal_identity` and redirects to `/login`.

### Route Protection

| Route       | Guard                                              |
|-------------|-----------------------------------------------------|
| `/`         | Checks `sessionStorage.portal_identity` on mount; redirects to `/login` if absent. |
| `/database` | No explicit guard (relies on same Layout/session check in Home). **⚠ Add a guard here on migration.** |
| `/login`    | Public — no guard.                                  |
| `/callback` | Public — no guard (processes the incoming token).   |

### Role-Based Access Control (RBAC)

- No page- or entity-level RBAC is enforced by this app currently.
- The `role` field from the identity object is stored but not acted upon.
- **On migration:** Implement middleware/guard using `identity.role` if you need role-gated pages.

### Base44-Specific Auth Notes

- `base44.auth.X` (the platform's own auth SDK) is **not used** by this app. The `AuthProvider` / `useAuth` boilerplate remains in `App.jsx` but is not exercised — the app relies entirely on portal SSO.
- The `AuthProvider` loading/error states in `App.jsx` wrap all routes; on migration you can remove `AuthProvider`, `useAuth`, and related boilerplate.

### Tokens

- Tokens expire after **5 minutes**.
- Tokens are single-use (`used` flag set to `true` on first valid redemption).
- Token validation happens client-side against the portal's Base44 database. **On migration:** Move this to a server-side endpoint to avoid exposing the portal's API key in the browser.