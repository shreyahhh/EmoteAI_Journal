import React from 'react';
import { motion } from 'framer-motion';
import { supabase, getSupabaseConfigIssue } from '../../../supabaseClient';
import Logo from '../../../components/shared/Logo';
import Starfield from '../../../components/shared/Starfield';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PasswordInput } from '../../../components/ui/password-input';
import { Label } from '../../../components/ui/label';

function formatAuthError(err) {
  if (!err?.message) return 'Something went wrong.';
  return err.message.replace(/^AuthApiError:\s*/i, '');
}

const AuthPage = ({ isLogin, navigateTo }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSendingReset, setIsSendingReset] = React.useState(false);
  const supabaseSetupIssue = !supabase ? getSupabaseConfigIssue() : null;

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?".');
      return;
    }
    if (!supabase) {
      setError(getSupabaseConfigIssue() || 'App is not configured for sign-in.');
      return;
    }
    setIsSendingReset(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setIsSendingReset(false);
    if (resetErr) {
      setError(formatAuthError(resetErr));
      return;
    }
    setInfo('Check your email for a password reset link.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    if (!email || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }
    if (!supabase) {
      setError(getSupabaseConfigIssue() || 'App is not configured for sign-in.');
      setIsLoading(false);
      return;
    }
    try {
      if (isLogin) {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) setError(formatAuthError(signErr));
      } else {
        const { data, error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) {
          setError(formatAuthError(signErr));
        } else if (data.user && !data.session) {
          setInfo('Check your email to confirm, then sign in.');
        }
      }
    } catch (err) {
      const msg = err?.message || String(err);
      if (/failed to fetch|networkerror|load failed|name not resolved/i.test(msg)) {
        setError('Cannot reach Supabase. Check REACT_APP_SUPABASE_URL and restart the dev server.');
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-emote-canvas font-sans text-emote-body text-emote-ink">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-10 lg:flex">
        <Starfield count={70} seed={42} />
        <button type="button" onClick={() => navigateTo('landing')} className="relative z-10 flex items-center gap-2.5">
          <Logo size={28} />
          <span className="emote-title-gradient text-emote-page">Emote</span>
        </button>
        <div className="relative z-10 max-w-md">
          <p className="font-display text-emote-page leading-snug text-emote-ink">
            Your words leave a trail, and it leads back to you.
          </p>
          <p className="mt-4 text-emote-muted text-emote-ink-soft">
            Private by design. Your entries are never a public feed, never a score, and you can export them whenever
            you like.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col justify-center border-l border-border px-6 py-12 sm:px-10 lg:w-[440px] lg:flex-none">
        <button type="button" onClick={() => navigateTo('landing')} className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Logo size={26} />
          <span className="emote-title-gradient text-emote-page">Emote</span>
        </button>

        <div className="mb-7 flex gap-6 border-b border-border text-emote-body">
          <button
            type="button"
            onClick={() => navigateTo('login')}
            className={`-mb-px border-b-2 pb-3 font-semibold transition ${
              isLogin ? 'border-emote-accent text-emote-ink' : 'border-transparent text-emote-ink-faint hover:text-emote-ink-soft'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigateTo('signup')}
            className={`-mb-px border-b-2 pb-3 font-semibold transition ${
              !isLogin ? 'border-emote-accent text-emote-ink' : 'border-transparent text-emote-ink-faint hover:text-emote-ink-soft'
            }`}
          >
            Create account
          </button>
        </div>

        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-emote-display font-semibold text-emote-ink">{isLogin ? 'Welcome back.' : 'Start your journal.'}</h1>
          <p className="mt-2 text-emote-muted text-emote-ink-soft">
            {isLogin ? 'Your journal syncs to this account, on every device.' : 'Free to start. No card, no trial countdown.'}
          </p>

          {supabaseSetupIssue && <p className="emote-banner-warn mt-5">{supabaseSetupIssue}</p>}
          {error && <p className="emote-banner-warn mt-5">{error}</p>}
          {info && <p className="emote-banner-info mt-5">{info}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="mb-0">
                  Password
                </Label>
                {isLogin ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isSendingReset}
                    className="text-emote-caption font-medium text-emote-accent hover:text-emote-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSendingReset ? 'Sending…' : 'Forgot password?'}
                  </button>
                ) : null}
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
            <Button type="submit" variant="gradient" size="lg" disabled={isLoading} className="w-full">
              {isLoading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-emote-muted text-emote-ink-faint">
            {isLogin ? (
              <>
                New here? <span className="font-semibold text-emote-accent">Switch to Create account above.</span>
              </>
            ) : (
              <>
                Already have an account? <span className="font-semibold text-emote-accent">Switch to Sign in above.</span>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
