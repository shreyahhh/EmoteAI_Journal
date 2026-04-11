import React from 'react';
import { supabase, getSupabaseConfigIssue } from '../supabaseClient';

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
  const supabaseSetupIssue = !supabase ? getSupabaseConfigIssue() : null;

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
        setError(
          'Cannot reach Supabase. Check REACT_APP_SUPABASE_URL and restart the dev server.',
        );
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-emote-canvas font-sans text-emote-body text-slate-900">
      <div className="emote-mesh" aria-hidden />

      <header className="relative z-10 px-6 py-5">
        <div className="container mx-auto flex items-center justify-between">
          <span className="emote-title-gradient text-emote-page font-semibold">Emote</span>
          <button
            type="button"
            onClick={() => navigateTo(isLogin ? 'signup' : 'login')}
            className="emote-btn-ghost"
          >
            {isLogin ? 'Create account' : 'Log in'}
          </button>
        </div>
      </header>

      <section className="relative z-10 px-6 pb-16 pt-6">
        <div className="container mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <h2 className="text-emote-display font-semibold tracking-tight text-slate-900 md:text-emote-display-lg">
              Journal with <span className="emote-title-gradient">AI insight</span>
            </h2>
            <p className="mt-3 max-w-md text-emote-muted leading-relaxed text-slate-600 lg:max-w-none">
              A calm place to write privately, see mood and themes over time, and ask questions that stay grounded in your own entries.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
            <div className="auth-card-emote">
              <h1 className="text-center text-emote-section font-semibold text-slate-900">
                {isLogin ? 'Sign in' : 'Create account'}
              </h1>
              <p className="mb-6 mt-1.5 text-center text-emote-muted text-slate-500">
                {isLogin ? 'Welcome back—your journal syncs to this account.' : 'Create a password you will remember; we will email you if confirmation is required.'}
              </p>
              {supabaseSetupIssue && <p className="emote-banner-warn mb-4 text-left">{supabaseSetupIssue}</p>}
              {error && <p className="emote-banner-warn mb-4 text-center">{error}</p>}
              {info && <p className="emote-banner-info mb-4 text-center">{info}</p>}
              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="emote-input"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-emote-caption font-medium uppercase tracking-wide text-slate-500">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="emote-input"
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </div>
                <button type="submit" disabled={isLoading} className="emote-btn-primary w-full disabled:cursor-not-allowed">
                  {isLoading ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
                </button>
              </form>
              <p className="relative z-10 mt-6 text-center text-emote-muted text-slate-500">
                {isLogin ? "No account? " : 'Have an account? '}
                <button
                  type="button"
                  onClick={() => navigateTo(isLogin ? 'signup' : 'login')}
                  className="font-semibold text-sky-600 hover:text-rose-600"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-200 px-6 py-8">
        <p className="text-center text-emote-muted text-slate-500">&copy; {new Date().getFullYear()} Emote</p>
      </footer>
    </div>
  );
};

export default AuthPage;
