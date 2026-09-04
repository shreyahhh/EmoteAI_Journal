import React from 'react';
import { motion } from 'framer-motion';
import { supabase, getSupabaseConfigIssue } from '../../../supabaseClient';
import Logo from '../../../components/shared/Logo';
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
    <div className="relative min-h-screen overflow-x-hidden bg-background font-sans text-emote-body text-foreground">
      <div className="emote-mesh" aria-hidden />

      <header className="relative z-10 px-6 py-5">
        <div className="container mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-lg"
          >
            <Logo size={30} />
            <span className="emote-title-gradient text-emote-page font-semibold">Emote</span>
          </button>
          <Button type="button" variant="outline" onClick={() => navigateTo(isLogin ? 'signup' : 'login')}>
            {isLogin ? 'Create account' : 'Log in'}
          </Button>
        </div>
      </header>

      <section className="relative z-10 px-6 pb-16 pt-6">
        <div className="container mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <h2 className="text-emote-display font-semibold tracking-tight text-foreground md:text-emote-display-lg">
              Journal with <span className="emote-title-gradient">AI insight</span>
            </h2>
            <p className="mt-3 max-w-md text-emote-muted leading-relaxed text-muted-foreground lg:max-w-none">
              A calm place to write privately, see mood and themes over time, and ask questions that stay grounded in your own entries.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-emote"
            >
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-emote-gold/40 via-emote-accent/30 to-emote-accent-2/20 blur-3xl"
                aria-hidden
              />
              <h1 className="relative z-10 text-center text-emote-section font-semibold text-foreground">
                {isLogin ? 'Sign in' : 'Create account'}
              </h1>
              <p className="relative z-10 mb-6 mt-1.5 text-center text-emote-muted text-muted-foreground">
                {isLogin
                  ? 'Welcome back—your journal syncs to this account.'
                  : 'Create a password you will remember; we will email you if confirmation is required.'}
              </p>
              {supabaseSetupIssue && <p className="emote-banner-warn relative z-10 mb-4 text-left">{supabaseSetupIssue}</p>}
              {error && <p className="emote-banner-warn relative z-10 mb-4 text-center">{error}</p>}
              {info && <p className="emote-banner-info relative z-10 mb-4 text-center">{info}</p>}
              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
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
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  {isLogin ? (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isSendingReset}
                      className="mt-1.5 text-emote-caption font-medium text-emote-accent hover:text-emote-gold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSendingReset ? 'Sending…' : 'Forgot password?'}
                    </button>
                  ) : null}
                </div>
                <Button type="submit" variant="gradient" disabled={isLoading} className="w-full">
                  {isLoading ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
                </Button>
              </form>
              <p className="relative z-10 mt-6 text-center text-emote-muted text-muted-foreground">
                {isLogin ? 'No account? ' : 'Have an account? '}
                <button
                  type="button"
                  onClick={() => navigateTo(isLogin ? 'signup' : 'login')}
                  className="font-semibold text-emote-accent hover:text-emote-gold"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-6 py-8">
        <p className="text-center text-emote-muted text-muted-foreground">&copy; {new Date().getFullYear()} Emote</p>
      </footer>
    </div>
  );
};

export default AuthPage;
