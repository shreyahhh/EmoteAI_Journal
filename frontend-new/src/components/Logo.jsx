import React from 'react';

/**
 * Emote mark: a leather journal cover (brown) with an open parchment page
 * (warm yellow) and a quill — deliberately fixed colors so the mark reads
 * the same combination of both theme hues in light and dark mode alike.
 */
export default function Logo({ size = 32, className = '', title = 'Emote' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="emote-logo-cover" x1="4" y1="6" x2="44" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8a5a2b" />
          <stop offset="100%" stopColor="#4a3220" />
        </linearGradient>
        <linearGradient id="emote-logo-page" x1="10" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdf1d6" />
          <stop offset="100%" stopColor="#e8c674" />
        </linearGradient>
        <linearGradient id="emote-logo-quill" x1="14" y1="34" x2="38" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c9971f" />
          <stop offset="100%" stopColor="#8a5a2b" />
        </linearGradient>
      </defs>

      <rect x="4" y="6" width="40" height="36" rx="7" fill="url(#emote-logo-cover)" />
      <rect x="9.5" y="11" width="29" height="26" rx="4" fill="url(#emote-logo-page)" />

      <line x1="15" y1="18" x2="27" y2="18" stroke="#4a3220" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15" y1="23" x2="24" y2="23" stroke="#4a3220" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="15" y1="28" x2="26" y2="28" stroke="#4a3220" strokeOpacity="0.25" strokeWidth="1.4" strokeLinecap="round" />

      <path
        d="M16 34 L34 10 C36.5 9 39 10 39.5 12.5 C40 15.5 37.5 18 35 18.5 L18 34.5 Z"
        fill="url(#emote-logo-quill)"
        stroke="#4a3220"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <path d="M16 34 L13.5 39" stroke="#4a3220" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
