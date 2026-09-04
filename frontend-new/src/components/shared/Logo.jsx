import React from 'react';
import logoImg from '../../assets/logo.png';

export default function Logo({ size = 32, className = '', title = 'Emote' }) {
  return (
    <img
      src={logoImg}
      width={size}
      height={size}
      className={className}
      alt={title}
      style={{ objectFit: 'contain' }}
    />
  );
}
