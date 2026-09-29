import type { ActivityItem } from './api';

const STORAGE_KEY = 'afterhours_user_activity';

export function getLocalActivities(): ActivityItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalActivity(item: ActivityItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalActivities();
    const filtered = existing.filter(
      (a) => a.id !== item.id && (a.txSignature ? a.txSignature !== item.txSignature : true),
    );
    const updated = [item, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save local activity:', err);
  }
}
