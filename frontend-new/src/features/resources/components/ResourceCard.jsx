import React from 'react';
import { Card } from '../../../components/ui/card';

const ResourceCard = ({ resource, onClick }) => (
  <Card
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    }}
    className="group flex cursor-pointer flex-col items-start p-6 text-left transition hover:border-emote-border-strong hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emote-accent/70"
  >
    <span className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110" aria-hidden>
      {resource.icon}
    </span>
    <h3 className="mb-2 text-emote-card-title font-semibold text-foreground">{resource.title}</h3>
    <p className="text-emote-muted leading-relaxed text-muted-foreground">{resource.description}</p>
  </Card>
);

export default ResourceCard;
