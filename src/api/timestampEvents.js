/**
 * Centralized data-access layer for TimestampEvent.
 *
 * All reads/writes to this entity go through here.
 * When migrating off Base44, replace the implementations below
 * with calls to your own REST API or database client —
 * no other file needs to change.
 */
import { base44 } from '@/api/base44Client';

const Entity = () => base44.entities.TimestampEvent;

/**
 * Load the most recent N events, newest first.
 * Used on mount in Home to restore session state.
 */
export async function listRecentEvents(limit = 200) {
  return Entity().list('-created_date', limit);
}

/**
 * Load all events for the audit log (Database page).
 */
export async function listAllEvents(limit = 5000) {
  return Entity().list('-created_date', limit);
}

/**
 * Persist a single timestamp event to the database.
 */
export async function createEvent(record) {
  return Entity().create(record);
}