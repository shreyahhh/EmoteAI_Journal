import React from 'react';
import { supabase, getSupabaseConfigIssue } from './supabaseClient';
import LoadingScreen from './components/shared/LoadingScreen';
import LandingPage from './features/landing/components/LandingPage';
import AuthPage from './features/auth/components/AuthPage';
import Dashboard from './features/dashboard/Dashboard';
import ResetPasswordPage from './features/auth/components/ResetPasswordPage';

export default function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState('landing');

  React.useEffect(() => {
    if (!supabase) {
      console.error(getSupabaseConfigIssue() || 'Supabase is not configured.');
      setLoading(false);
      setPage('landing');
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) setPage('dashboard');
        setLoading(false);
      })
      .catch((err) => {
        console.error('getSession failed:', err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'PASSWORD_RECOVERY') {
        setPage('reset-password');
      } else if (session?.user) {
        setPage('dashboard');
      } else {
        setPage((prev) => (prev === 'dashboard' ? 'landing' : prev));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigateTo = (pageName) => {
    setPage(pageName);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  switch (page) {
    case 'landing':
      return <LandingPage navigateTo={navigateTo} />;
    case 'signup':
      return <AuthPage isLogin={false} navigateTo={navigateTo} />;
    case 'reset-password':
      return <ResetPasswordPage onDone={() => navigateTo(user ? 'dashboard' : 'login')} />;
    case 'dashboard':
      return user ? <Dashboard user={user} /> : <AuthPage isLogin navigateTo={navigateTo} />;
    case 'login':
      return <AuthPage isLogin navigateTo={navigateTo} />;
    default:
      return <LandingPage navigateTo={navigateTo} />;
  }
}
