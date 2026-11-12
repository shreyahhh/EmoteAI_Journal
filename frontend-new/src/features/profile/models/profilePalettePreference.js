/** The three "paper" accent palettes shown in Settings → Appearance.
 * `dots` are decorative preview colors only (swatch cards) — the actual
 * theme is driven entirely by the `data-palette` CSS overrides in index.css. */
export const PALETTES = [
  { id: 'galaxy', label: 'Galaxy', canvas: '#040407', dots: ['#f8f7ff', '#9bb0ff', '#ffd2a1'] },
  { id: 'indigo', label: 'Indigo hour', canvas: '#0c0e1a', dots: ['#e0c069', '#7a8fd9', '#e0a845'] },
  { id: 'moss', label: 'Moss', canvas: '#0d110e', dots: ['#8fbf8a', '#7fa0c4', '#d9b35c'] },
];

const STORAGE_KEY = 'emote-palette';

export function getStoredPalette() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return PALETTES.some((p) => p.id === stored) ? stored : 'galaxy';
  } catch {
    return 'galaxy';
  }
}

export function applyPalette(paletteId) {
  const id = PALETTES.some((p) => p.id === paletteId) ? paletteId : 'galaxy';
  if (id === 'galaxy') {
    document.documentElement.removeAttribute('data-palette');
  } else {
    document.documentElement.setAttribute('data-palette', id);
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* best-effort only — palette just won't persist across reloads */
  }
}
