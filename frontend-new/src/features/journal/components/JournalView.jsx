import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Tag } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { analyzeEntry } from '../../../lib/gemini';
import { ACTIVITY_OPTIONS } from '../../../lib/moodMeta';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const JournalView = ({ user }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const savedTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(savedTimeoutRef.current), []);

  const handleToggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  };

  const handleSaveEntry = async () => {
    if (!content.trim() || !supabase || !user?.id || isSaving) return;
    setIsSaving(true);

    const activityLabels = {};
    selectedActivities.forEach((key) => {
      const opt = ACTIVITY_OPTIONS.find((o) => o.key === key);
      if (opt) activityLabels[key] = opt.label;
    });

    const savedContent = content;
    const savedTitle = title.trim() || savedContent.trim().split('\n')[0].slice(0, 80);

    // Save immediately so the app never blocks on the AI call; the entry is
    // updated in place (and picked up by Dashboard's realtime subscription)
    // once analysis finishes.
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: savedTitle,
        content: savedContent,
        sentiment_score: null,
        emotions: [],
        themes: [],
        activities: selectedActivities,
        activity_labels: activityLabels,
        mood: 'neutral',
      })
      .select()
      .single();

    if (error) {
      console.error('Save entry error:', error);
      setIsSaving(false);
      return;
    }

    setTitle('');
    setContent('');
    setSelectedActivities([]);
    setTagsOpen(false);
    setIsSaving(false);
    titleRef.current?.focus();

    setJustSaved(true);
    clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000);

    analyzeEntry(savedContent).then((analysis) => {
      if (analysis.failed) return;
      supabase
        .from('journal_entries')
        .update({
          sentiment_score: analysis.sentimentScore,
          emotions: analysis.emotions,
          themes: analysis.themes,
          mood: analysis.mood,
        })
        .eq('id', data.id)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Analysis update error:', updateError);
        });
    });
  };

  const handleSaveShortcut = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveEntry();
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      textareaRef.current?.focus();
      return;
    }
    handleSaveShortcut(e);
  };

  return (
    <div className="flex flex-col">
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleTitleKeyDown}
        placeholder="Title"
        autoFocus
        className="w-full border-none bg-transparent pb-2 font-display text-emote-section font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleSaveShortcut}
        placeholder="Start writing…"
        className="min-h-[50vh] w-full resize-none border-none bg-transparent font-sans text-emote-body leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />

      <AnimatePresence initial={false}>
        {tagsOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-4">
              {ACTIVITY_OPTIONS.map((activity) => {
                const isSelected = selectedActivities.includes(activity.key);
                return (
                  <button
                    type="button"
                    key={activity.key}
                    onClick={() => handleToggleActivity(activity.key)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-emote-muted font-medium transition',
                      isSelected
                        ? 'bg-emote-accent/15 text-emote-accent-2 ring-1 ring-emote-accent/30'
                        : 'border border-border bg-secondary text-secondary-foreground hover:border-emote-border-strong',
                    )}
                  >
                    {activity.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setTagsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-emote-muted text-muted-foreground transition hover:text-foreground"
        >
          <Tag className="h-4 w-4" />
          {selectedActivities.length
            ? `${selectedActivities.length} tag${selectedActivities.length > 1 ? 's' : ''}`
            : 'Add tags'}
        </button>
        <Button
          type="button"
          variant={justSaved ? 'default' : 'gradient'}
          onClick={handleSaveEntry}
          disabled={isSaving || (!content.trim() && !justSaved) || !supabase}
          className="min-w-[120px] overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {isSaving ? 'Saving…' : 'Save entry'}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
};

export default JournalView;
