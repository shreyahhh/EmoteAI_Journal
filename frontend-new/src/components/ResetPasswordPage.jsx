import React from 'react';
import { supabase } from '../supabaseClient';

/**
 * Shown when Supabase redirects back to the app with a password-recovery
 * session (after the user clicks the reset link from their email). See
 * App.js, which routes here on the PASSWORD_RECOVERY auth event.
 */
const ResetPasswordPage = ({ onDone }) => {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (updateError) {
      setError(updateError.message || 'Could not update password.');
      return;
    }
    onDone?.();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-emote-canvas px-6 font-sans text-emote-ink">
      <div className="emote-mesh" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <div className="auth-card-emote">
          <h1 className="text-center text-emote-section font-semibold text-emote-ink">Set a new password</h1>
          <p className="mb-6 mt-1.5 text-center text-emote-muted text-emote-ink-soft">
            Choose a new password for your account.
          </p>
          {error && <p className="emote-banner-warn mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
                New password
              </label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="emote-input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-emote-ink-faint">
                Confirm password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="emote-input"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={isSaving} className="emote-btn-primary w-full disabled:cursor-not-allowed">
              {isSaving ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
