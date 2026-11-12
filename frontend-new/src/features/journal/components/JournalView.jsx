import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Mic, MicOff, Tag } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { analyzeEntry } from '../models/journalEntryAnalysis';
import { updateEntryRow } from '../models/journalEntryUpdate';
import { ACTIVITY_OPTIONS } from '../../../lib/models/moodMeta';
import { useSpeechToText } from '../../../lib/hooks/useSpeechToText';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import Toast from '../../../components/shared/Toast';
import { assignPlanetsForEntry } from '../../galaxy/models/galaxyPlanetState';
import { planetNotificationMessage } from '../../galaxy/models/galaxyNotify';

const JournalView = ({ user, profile }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const savedTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(savedTimeoutRef.current), []);

  const { isSupported: sttSupported, isListening, toggle: toggleListening } = useSpeechToText({
    onResult: (phrase) => {
      if (!phrase) return;
      setContent((prev) => (prev && !/\s$/.test(prev) ? `${prev} ${phrase}` : `${prev}${phrase}`));
    },
  });

  const handleToggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  };

  const handleSaveEntry = async () => {
    if (!content.trim() || !supabase || !user?.id || isSaving) return;
    if (isListening) toggleListening();
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
      updateEntryRow(supabase, data.id, {
        sentiment_score: analysis.sentimentScore,
        emotions: analysis.emotions,
        ...(analysis.themesFailed ? {} : { themes: analysis.themes }),
        mood: analysis.mood,
        ...(analysis.analysis ? { analysis: analysis.analysis } : {}),
      })
        .then(({ error: updateError }) => {
          if (updateError) console.error('Analysis update error:', updateError);
        });

      if (analysis.planetScores) {
        assignPlanetsForEntry(supabase, user.id, data.id, analysis.planetScores, analysis.sentimentScore)
          .then((result) => {
            const message = planetNotificationMessage(result, profile?.planetNotificationsEnabled ?? true);
            if (message) setToastMessage(message);
          })
          .catch((e) => console.error('Planet assignment error:', e));
      }
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
        className="min-h-[50vh] w-full resize-none border-none bg-transparent font-serif text-emote-body leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />
      {isListening ? (
        <p className="-mt-2 mb-2 flex items-center gap-1.5 text-emote-caption text-emote-rose">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emote-rose opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emote-rose" />
          </span>
          Listening…
        </p>
      ) : null}

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
                      'rounded-none px-3 py-1.5 text-emote-muted font-medium transition',
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
        <div className="flex items-center gap-4">
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
          {sttSupported ? (
            <button
              type="button"
              onClick={toggleListening}
              aria-pressed={isListening}
              title={isListening ? 'Stop dictating' : 'Speak your entry'}
              className={cn(
                'flex items-center gap-1.5 text-emote-muted transition',
                isListening ? 'text-emote-rose' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? 'Stop' : 'Speak'}
            </button>
          ) : null}
        </div>
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
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
};

export default JournalView;
