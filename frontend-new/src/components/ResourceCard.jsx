import React from 'react';

const ResourceCard = ({ resource, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full flex-col items-start rounded-2xl border border-emote-border bg-emote-surface p-6 text-left shadow-sm transition hover:border-emote-border-strong hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent/70"
  >
    <span className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110" aria-hidden>
      {resource.icon}
    </span>
    <h3 className="mb-2 text-emote-card-title font-semibold text-emote-ink">{resource.title}</h3>
    <p className="text-emote-muted leading-relaxed text-emote-ink-soft">{resource.description}</p>
  </button>
);

export default ResourceCard;
