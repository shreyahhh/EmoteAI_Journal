import React, { useState, useMemo } from 'react';
import ResourceDetailModal from './ResourceDetailModal';
import ResourceCard from './ResourceCard';
import { matchTagsFuzzy } from '../../../lib/themeMatch';

const THEME_MAP = {
  anxiety: 'anxiety',
  stress: 'anxiety',
  worry: 'anxiety',
  sadness: 'depression',
  'low mood': 'depression',
  depression: 'depression',
  anger: 'anger',
  frustration: 'anger',
  'self-doubt': 'confidence',
  insecurity: 'confidence',
  relationships: 'relationships',
  'family conflict': 'relationships',
  loneliness: 'relationships',
  'personal growth': 'growth',
  mindfulness: 'growth',
};

const ResourcesPanel = ({ entries }) => {
  const [selectedResource, setSelectedResource] = useState(null);

  const recommendations = useMemo(() => {
    const recentEntries = entries.slice(0, 5);
    if (recentEntries.length < 2) return ['general'];
    const allThemes = recentEntries.flatMap((entry) => entry.themes || []);
    const matched = matchTagsFuzzy(allThemes, THEME_MAP);
    return matched.length > 0 ? matched : ['general'];
  }, [entries]);

  const allResources = {
    anxiety: { id: 'anxiety', title: 'Managing Anxiety', description: 'Techniques to calm a worried mind and handle feelings of stress.', icon: '🧠' },
    depression: { id: 'depression', title: 'Lifting Your Mood', description: "Strategies for when you're feeling down or unmotivated.", icon: '☀️' },
    anger: { id: 'anger', title: 'Handling Anger', description: 'Constructive ways to process and express anger without causing harm.', icon: '💨' },
    confidence: { id: 'confidence', title: 'Building Confidence', description: 'Exercises to challenge self-doubt and recognize your strengths.', icon: '💪' },
    relationships: { id: 'relationships', title: 'Navigating Relationships', description: 'Guidance on communication, boundaries, and connection with others.', icon: '🤝' },
    growth: { id: 'growth', title: 'Mindfulness & Growth', description: 'Cultivate awareness and continue your personal growth journey.', icon: '🌱' },
    general: { id: 'general', title: 'General Wellness', description: 'General tips and information for maintaining your mental well-being.', icon: '❤️' },
  };

  return (
    <>
      {selectedResource && (
        <ResourceDetailModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}

      <div className="emote-banner-warn mb-8" role="alert">
        <strong className="font-semibold text-emote-ink">Crisis support: </strong>
        <span className="text-emote-ink/95">
          If you are in crisis or someone may be in danger, do not rely on this app. Contact your local emergency number or a crisis hotline.
        </span>
      </div>

      <h2 className="emote-title-gradient text-emote-section">Recommended</h2>
      <p className="mb-6 mt-1.5 max-w-2xl text-emote-muted leading-relaxed text-emote-ink-faint">
        Topics we surface when your recent entries mention matching themes—still worth a look even if the list is short.
      </p>
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((key) => (
          <ResourceCard key={key} resource={allResources[key]} onClick={() => setSelectedResource(allResources[key])} />
        ))}
      </div>

      <hr className="mb-10 border-emote-border" />

      <h2 className="emote-title-gradient text-emote-section">All topics</h2>
      <p className="mb-6 mt-1.5 max-w-2xl text-emote-muted leading-relaxed text-emote-ink-faint">
        Self-guided overviews—not a substitute for professional care. Open any card for a fuller read.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(allResources).map((resource) => (
          <ResourceCard key={resource.id} resource={resource} onClick={() => setSelectedResource(resource)} />
        ))}
      </div>
    </>
  );
};

export default ResourcesPanel;
