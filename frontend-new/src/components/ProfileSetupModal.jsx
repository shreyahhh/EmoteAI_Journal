import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const SEX_OPTIONS = [
  { value: '', label: 'Select…' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' },
];

/**
 * First-run profile: name, username, age, sex — email read-only from auth.
 * Skip still sets profile_completed_at so the app does not block again.
 */
const ProfileSetupModal = ({ user, initialProfile, onComplete }) => {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || '');
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [age, setAge] = useState(initialProfile?.age != null ? String(initialProfile.age) : '');
  const [sex, setSex] = useState(initialProfile?.sex || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const email = user?.email || initialProfile?.email || '';

  const save = async (skipped) => {
    setError('');
    if (!supabase || !user?.id) {
      setError('Not connected. Check Supabase configuration.');
      return;
    }
    if (!skipped) {
      if (!displayName.trim()) {
        setError('Please enter your name (or use Skip for now).');
        return;
      }
      if (!sex) {
        setError('Please select how you identify — we use this only to tailor insights (e.g. cycle tools for women).');
        return;
      }
    }
    setSaving(true);
    const ageNum = age.trim() === '' ? null : parseInt(age, 10);
    const payload = {
      id: user.id,
      email: email || null,
      display_name: displayName.trim() || null,
      username: username.trim() || null,
      age: age.trim() === '' || Number.isNaN(ageNum) ? null : ageNum,
      sex: sex || null,
      profile_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (upErr) {
      console.error('Profile save:', upErr);
      setError(
        upErr.message?.includes('column') || upErr.code === 'PGRST204'
          ? 'Database needs the profile migration. Run supabase_profile_cycle_migration.sql in the Supabase SQL editor, then try again.'
          : upErr.message || 'Could not save profile.',
      );
      return;
    }
    onComplete?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-setup-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emote-border bg-emote-surface p-6 shadow-emote shadow-emote-glow sm:p-8">
        <h2 id="profile-setup-title" className="text-emote-section font-semibold text-emote-ink">
          Tell us a bit about you
        </h2>
        <p className="mt-2 text-emote-muted leading-relaxed text-emote-ink-soft">
          This helps us show clearer trends and optional features. You can change details later in settings when we add
          editing there. Everything stays on your account.
        </p>

        {error ? <p className="emote-banner-warn mt-4">{error}</p> : null}

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="prof-email" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Email
            </label>
            <input id="prof-email" type="email" readOnly value={email} className="emote-input bg-emote-surface-alt text-emote-ink-soft" />
          </div>
          <div>
            <label htmlFor="prof-name" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Name <span className="text-rose-800">*</span>
            </label>
            <input
              id="prof-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="emote-input"
              placeholder="How we should greet you"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="prof-user" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Username <span className="font-normal text-emote-ink-faint">(optional)</span>
            </label>
            <input
              id="prof-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              className="emote-input"
              placeholder="letters_numbers"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="prof-age" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Age <span className="font-normal text-emote-ink-faint">(optional)</span>
            </label>
            <input
              id="prof-age"
              type="number"
              min={13}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="emote-input"
              placeholder="e.g. 28"
            />
          </div>
          <div>
            <label htmlFor="prof-sex" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
              Sex / gender identity <span className="text-rose-800">*</span>
            </label>
            <select id="prof-sex" value={sex} onChange={(e) => setSex(e.target.value)} className="emote-input cursor-pointer py-2.5">
              {SEX_OPTIONS.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-emote-caption text-emote-ink-faint">
              If you select <span className="font-semibold text-emote-ink-soft">Female</span>, you will see an optional
              period calendar (start/end dates), symptoms, and mood notes alongside your journal.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={saving} onClick={() => save(true)} className="emote-btn-ghost w-full sm:w-auto">
            Skip for now
          </button>
          <button type="button" disabled={saving} onClick={() => save(false)} className="emote-btn-primary w-full sm:w-auto">
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;
