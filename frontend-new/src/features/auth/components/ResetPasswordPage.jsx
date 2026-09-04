import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../supabaseClient';
import { Button } from '../../../components/ui/button';
import { PasswordInput } from '../../../components/ui/password-input';
import { Label } from '../../../components/ui/label';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-6 font-sans text-foreground">
      <div className="emote-mesh" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-emote"
        >
          <h1 className="text-center text-emote-section font-semibold text-foreground">Set a new password</h1>
          <p className="mb-6 mt-1.5 text-center text-emote-muted text-muted-foreground">
            Choose a new password for your account.
          </p>
          {error && <p className="emote-banner-warn mb-4 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="gradient" disabled={isSaving} className="w-full">
              {isSaving ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
