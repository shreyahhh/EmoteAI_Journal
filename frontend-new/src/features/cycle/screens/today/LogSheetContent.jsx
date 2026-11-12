import React, { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import Chip from '../../components/Chip';
import SegmentedControl from '../../components/SegmentedControl';
import FlowPicker from '../../components/FlowPicker';

const PAIN_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'mild', label: 'Mild' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'severe', label: 'Severe' },
];
const MOOD_OPTIONS = ['Calm', 'Sensitive', 'Irritable', 'Anxious', 'Low', 'Energetic'].map((l) => ({
  id: l.toLowerCase(),
  label: l,
}));
const BODY_OPTIONS = ['Cramps', 'Bloating', 'Tender breasts', 'Headache', 'Back pain', 'Acne'].map((l) => ({
  id: l.toLowerCase().replace(/\s+/g, '_'),
  label: l,
}));
const SLEEP_OPTIONS = [
  { id: 'poor', label: 'Poor' },
  { id: 'ok', label: 'OK' },
  { id: 'good', label: 'Good' },
];
// Placeholder vocabulary — exact labels pending the 2.2 Figma screen's "+" row; safe to relabel later without a schema change (cravings is a free text[]).
const CRAVING_OPTIONS = ['Sweet', 'Salty', 'More hungry', 'Less hungry'].map((l) => ({
  id: l.toLowerCase().replace(/\s+/g, '_'),
  label: l,
}));
const DISCHARGE_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'light', label: 'Light' },
  { id: 'creamy', label: 'Creamy' },
  { id: 'egg_white', label: 'Egg-white' },
  { id: 'sticky', label: 'Sticky' },
];
const PRODUCT_OPTIONS = ['Pad', 'Tampon', 'Cup', 'Period underwear', 'Disc'].map((l) => ({
  id: l.toLowerCase().replace(/\s+/g, '_'),
  label: l,
}));

function countLogged(log) {
  return (
    (log.flow && log.flow !== 'none' ? 1 : 0) +
    (log.pain && log.pain !== 'none' ? 1 : 0) +
    log.mood.length +
    log.symptoms.length +
    (log.sleep ? 1 : 0) +
    log.cravings.length +
    (log.discharge && log.discharge !== 'none' ? 1 : 0) +
    log.products.length
  );
}

function toggleInList(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/**
 * The Log form's body — identical content for the mobile BottomSheet and the
 * desktop inline panel. `hideFlow` is used on 2.4 (Today during a period),
 * where flow already has its own inline picker directly on Today.
 */
const LogSheetContent = ({ log, onChange, onSave, onCancel, saving = false, saved = false, hideFlow = false }) => {
  const [expanded, setExpanded] = useState(false);
  const loggedCount = countLogged(log);

  return (
    <div className="pb-2 pt-1">
      {onCancel ? (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-emote-body font-medium text-cycle-text">How&rsquo;s today?</span>
          <button type="button" onClick={onCancel} className="min-h-11 px-2 text-emote-muted text-cycle-faint">
            Cancel
          </button>
        </div>
      ) : null}

      <div className="space-y-5">
        {!hideFlow ? (
          <Section label="Flow">
            <FlowPicker value={log.flow} onChange={(v) => onChange('flow', v)} />
          </Section>
        ) : null}

        <Section label="Pain">
          <SegmentedControl options={PAIN_OPTIONS} value={log.pain || 'none'} onChange={(v) => onChange('pain', v)} />
        </Section>

        <Section label="Mood">
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((o) => (
              <Chip key={o.id} active={log.mood.includes(o.id)} onClick={() => onChange('mood', toggleInList(log.mood, o.id))}>
                {o.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section label="Body">
          <div className="flex flex-wrap gap-2">
            {BODY_OPTIONS.map((o) => (
              <Chip key={o.id} active={log.symptoms.includes(o.id)} onClick={() => onChange('symptoms', toggleInList(log.symptoms, o.id))}>
                {o.label}
              </Chip>
            ))}
          </div>
        </Section>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between rounded-none border border-dashed border-cycle-line px-3.5 text-emote-muted font-semibold uppercase tracking-wider text-cycle-text-2"
        >
          <span>Sleep, cravings, discharge, products</span>
          {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>

        {expanded ? (
          <div className="space-y-5">
            <Section label="Sleep">
              <SegmentedControl options={SLEEP_OPTIONS} value={log.sleep || ''} onChange={(v) => onChange('sleep', v)} />
            </Section>
            <Section label="Cravings">
              <div className="flex flex-wrap gap-2">
                {CRAVING_OPTIONS.map((o) => (
                  <Chip key={o.id} active={log.cravings.includes(o.id)} onClick={() => onChange('cravings', toggleInList(log.cravings, o.id))}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </Section>
            <Section label="Discharge">
              <SegmentedControl options={DISCHARGE_OPTIONS} value={log.discharge || 'none'} onChange={(v) => onChange('discharge', v)} />
            </Section>
            <Section label="Products" hint="helps you plan">
              <div className="flex flex-wrap gap-2">
                {PRODUCT_OPTIONS.map((o) => (
                  <Chip key={o.id} active={log.products.includes(o.id)} onClick={() => onChange('products', toggleInList(log.products, o.id))}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </Section>
          </div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-cycle-line pt-4">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={cn(
            'min-h-[54px] w-full rounded-none text-emote-body font-semibold uppercase tracking-wider transition',
            saved ? 'bg-cycle-surface-2 text-cycle-text' : 'bg-cycle-accent text-cycle-accent-ink hover:brightness-110',
          )}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4" /> Saved
            </span>
          ) : saving ? (
            'Saving…'
          ) : loggedCount > 0 ? (
            `Save · ${loggedCount} thing${loggedCount === 1 ? '' : 's'} logged`
          ) : (
            'Save'
          )}
        </Button>
        <p className="mt-2 text-center text-emote-caption text-cycle-faint">Saved beside tonight&rsquo;s journal entry.</p>
      </div>
    </div>
  );
};

const Section = ({ label, hint, children }) => (
  <div>
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-emote-caption font-semibold uppercase tracking-wider text-cycle-faint">{label}</span>
      {hint ? <span className="text-emote-caption text-cycle-faint">{hint}</span> : null}
    </div>
    {children}
  </div>
);

export default LogSheetContent;
