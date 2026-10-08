/**
 * Key for matching a journal line across edits: lowercase, alphanumerics and
 * single spaces only. Must stay identical to norm_line() in ml/predict.py.
 */
export function normLine(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
