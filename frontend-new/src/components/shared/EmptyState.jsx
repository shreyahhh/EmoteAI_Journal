import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

/** The "nothing here yet" panel repeated across Insights/Entries/Timeline/Goals. */
export default function EmptyState({ title, description, className, children }) {
  return (
    <Card className={cn('text-center', className)}>
      <CardContent className="pt-6">
        <h3 className="text-emote-card-title font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-2 text-emote-muted leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
