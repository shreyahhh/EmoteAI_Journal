import { PLANETS_BY_ID } from './galaxyPlanetsConfig';

const STORAGE_KEY = 'emote-planet-notification-date';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function alreadyNotifiedToday() {
  try {
    return localStorage.getItem(STORAGE_KEY) === today();
  } catch {
    return false;
  }
}

function markNotifiedToday() {
  try {
    localStorage.setItem(STORAGE_KEY, today());
  } catch {
    // Private browsing / storage disabled — just means the daily cap can't
    // be tracked this session, not worth failing the save over.
  }
}

/**
 * At most one in-app "joined a planet" message per day, naming the primary
 * planet; first appearance takes priority over the regular join message
 * (PRD section 16). Returns null when there's nothing to say or the user
 * turned these off in Settings.
 */
export function planetNotificationMessage({ primary, newlyVisible } = {}, planetNotificationsEnabled = true) {
  if (!planetNotificationsEnabled || !primary) return null;
  if (alreadyNotifiedToday()) return null;
  markNotifiedToday();
  if (newlyVisible?.includes(primary)) return PLANETS_BY_ID[primary].firstAppearance;
  return PLANETS_BY_ID[primary].notification;
}
