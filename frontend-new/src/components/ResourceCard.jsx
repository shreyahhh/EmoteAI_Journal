import React from 'react';

const ResourceCard = ({ resource, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
  >
    <span className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110" aria-hidden>
      {resource.icon}
    </span>
    <h3 className="mb-2 text-emote-card-title font-semibold text-slate-900">{resource.title}</h3>
    <p className="text-emote-muted leading-relaxed text-slate-600">{resource.description}</p>
  </button>
);

export default ResourceCard;
