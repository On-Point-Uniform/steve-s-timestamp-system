/**
 * Centralized data-access layer for portal SSO authentication.
 *
 * Uses a separate Base44 client pointing at the On Point Portal app
 * (appId: 6a5545ad446ace2ec9960075) to validate one-time auth tokens.
 *
 * When migrating off Base44, replace these with calls to your own
 * auth-validation endpoint. The sessionStorage contract (key
 * 'portal_identity', shape { employee_name, role, employee_id })
 * stays the same — only the network calls change.
 */
import { portalBase44 } from '@/lib/portalClient';

/**
 * Look up a token that has not yet been used.
 * Returns the token record or null.
 */
export async function findValidToken(token) {
  const results = await portalBase44.entities.ExternalAuthToken.filter({ token, used: false });
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Mark a token as consumed so it cannot be reused.
 */
export async function consumeToken(tokenId) {
  return portalBase44.entities.ExternalAuthToken.update(tokenId, { used: true });
}

// ---------- sessionStorage helpers ----------

const SESSION_KEY = 'portal_identity';

export function getIdentity() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveIdentity(identity) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(identity));
}

export function clearIdentity() {
  sessionStorage.removeItem(SESSION_KEY);
}