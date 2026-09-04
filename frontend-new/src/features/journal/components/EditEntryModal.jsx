import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../supabaseClient';
import { analyzeEntry } from '../../../lib/gemini';
import { ACTIVITY_OPTIONS } from '../../../lib/moodMeta';
import { cn } from '../../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';

/**
 * Edit an existing journal entry in place. Re-runs AI analysis on save so
 * mood/emotions/themes stay consistent with the edited content — the same
 * behavior as creating a new entry.
 */
const EditEntryModal = ({ entry, onClose }) => {
  const [title, setTitle] = useState(entry.title || '');
  const [content, setContent] = useState(entry.content || '');
  const [selectedActivities, setSelectedActivities] = useState(entry.activities || []);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const handleToggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim() || !supabase) return;
    setIsSaving(true);
    setError('');
    setStatusMessage('Analyzing...');

    const activityLabels = {};
    selectedActivities.forEach((key) => {
      const opt = ACTIVITY_OPTIONS.find((o) => o.key === key);
      if (opt) activityLabels[key] = opt.label;
    });

    const analysis = await analyzeEntry(content);

    setStatusMessage('Saving...');
    const update = {
      title: title || '',
      content,
      activities: selectedActivities,
      activity_labels: activityLabels,
    };
    if (!analysis.failed) {
      update.sentiment_score = analysis.sentimentScore;
      update.emotions = analysis.emotions;
      update.themes = analysis.themes;
      update.mood = analysis.mood;
    }

    const { error: updateError } = await supabase.from('journal_entries').update(update).eq('id', entry.id);
    setIsSaving(false);
    if (updateError) {
      console.error('Update entry error:', updateError);
      setError('Could not save changes. Try again.');
      setStatusMessage('');
      return;
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="max-h-[65vh] space-y-5 overflow-y-auto">
          {error ? <p className="emote-banner-warn">{error}</p> : null}

          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional — a few words to find this later"
            />
          </div>

          <div>
            <Label htmlFor="edit-body">Entry</Label>
            <Textarea id="edit-body" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="min-h-[200px] resize-y" />
          </div>

          <div>
            <p className="mb-1 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Activities</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((activity) => {
                const isSelected = selectedActivities.includes(activity.key);
                return (
                  <motion.button
                    type="button"
                    key={activity.key}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleToggleActivity(activity.key)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-emote-muted font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                      isSelected
                        ? 'bg-gradient-to-r from-emote-accent-2/20 to-emote-gold/20 text-foreground ring-1 ring-emote-accent/30'
                        : 'border border-border bg-secondary text-secondary-foreground hover:border-emote-border-strong hover:bg-card',
                    )}
                  >
                    {activity.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isSaving || !content.trim()} className="min-w-[160px]">
              {isSaving ? statusMessage || 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEntryModal;
