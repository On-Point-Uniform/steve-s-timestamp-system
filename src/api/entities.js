/**
 * Single consolidated data-access layer for all entities.
 *
 * To migrate off Base44, replace only the implementations in this file
 * with calls to your own REST API — no page or component needs to change.
 */
import { base44 } from '@/api/base44Client';
import { portalBase44 } from '@/lib/portalClient';

// ---------------------------------------------------------------------------
// TimestampEvent — this app's own database
// ---------------------------------------------------------------------------

const TimestampEvent = () => base44.entities.TimestampEvent;

/**
 * Load the most recent N events (newest first).
 * Used on mount in Home.jsx to restore current session state.
 */
export async function listRecentEvents(limit = 200) {
  return TimestampEvent().list('-created_date', limit);
}

/**
 * Load all events for the audit log (Database page).
 */
export async function listAllEvents(limit = 5000) {
  return TimestampEvent().list('-created_date', limit);
}

/**
 * Persist a single timestamp event (Stamp In / Break Start / Break End / Stamp Out).
 */
export async function createTimestampEvent(record) {
  return TimestampEvent().create(record);
}

// ---------------------------------------------------------------------------
// ExternalAuthToken — On Point Portal app (appId: 6a5545ad446ace2ec9960075)
// ---------------------------------------------------------------------------

const ExternalAuthToken = () => portalBase44.entities.ExternalAuthToken;

/**
 * Find an unused, valid auth token issued by the portal.
 * Returns the token record or null.
 */
export async function findValidToken(token) {
  const results = await ExternalAuthToken().filter({ token, used: false });
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Mark a portal token as consumed (one-time use).
 */
export async function consumeToken(tokenId) {
  return ExternalAuthToken().update(tokenId, { used: true });
}

// ---------------------------------------------------------------------------
// sessionStorage helpers — portal identity
// ---------------------------------------------------------------------------

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