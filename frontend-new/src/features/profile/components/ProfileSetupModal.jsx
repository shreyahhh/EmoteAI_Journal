import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';

const SEX_OPTIONS = [
  { value: 'unset', label: 'Select…' },
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
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-w-lg"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tell us a bit about you</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-emote-muted leading-relaxed text-emote-ink-soft">
          This helps us show clearer trends and optional features. You can change details later in settings when we add
          editing there. Everything stays on your account.
        </p>

        {error ? <p className="emote-banner-warn">{error}</p> : null}

        <div className="space-y-4">
          <div>
            <Label htmlFor="prof-email">Email</Label>
            <Input id="prof-email" type="email" readOnly value={email} className="bg-secondary text-secondary-foreground" />
          </div>
          <div>
            <Label htmlFor="prof-name">
              Name <span className="text-rose-800">*</span>
            </Label>
            <Input
              id="prof-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How we should greet you"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="prof-user">
              Username <span className="font-normal normal-case text-emote-ink-faint">(optional)</span>
            </Label>
            <Input
              id="prof-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="letters_numbers"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="prof-age">
              Age <span className="font-normal normal-case text-emote-ink-faint">(optional)</span>
            </Label>
            <Input
              id="prof-age"
              type="number"
              min={13}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
            />
          </div>
          <div>
            <Label htmlFor="prof-sex">
              Sex / gender identity <span className="text-rose-800">*</span>
            </Label>
            <Select value={sex || 'unset'} onValueChange={(v) => setSex(v === 'unset' ? '' : v)}>
              <SelectTrigger id="prof-sex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEX_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-emote-caption text-emote-ink-faint">
              If you select <span className="font-semibold text-emote-ink-soft">Female</span>, you will see an optional
              period calendar (start/end dates), symptoms, and mood notes alongside your journal.
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => save(true)} className="w-full sm:w-auto">
            Skip for now
          </Button>
          <Button type="button" variant="gradient" disabled={saving} onClick={() => save(false)} className="w-full sm:w-auto">
            {saving ? 'Saving…' : 'Save & continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupModal;
