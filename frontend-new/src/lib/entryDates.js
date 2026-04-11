/**
 * Normalize createdAt from Supabase (ISO string), Firestore (Timestamp), or Date.
 */
export function getCreatedAtDate(entry) {
  const v = entry?.createdAt ?? entry?.created_at;
  if (v == null) return null;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  return null;
}

export function formatCreatedAt(entry, options) {
  const d = getCreatedAtDate(entry);
  if (!d || Number.isNaN(d.getTime())) return 'Just now';
  return d.toLocaleDateString('en-US', options || {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
