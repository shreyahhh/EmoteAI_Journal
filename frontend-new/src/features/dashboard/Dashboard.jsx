import React from 'react';
import { supabase, mapJournalRow, mapProfileRow, mapCyclePeriodRow } from '../../supabaseClient';
import AppShell from '../../layout/AppShell';
import { Card, CardContent } from '../../components/ui/card';
import JournalView from '../journal/components/JournalView';
import EntriesView from '../entries/components/EntriesView';
import SettingsModal from '../profile/components/SettingsModal';
import ProfileSetupModal from '../profile/components/ProfileSetupModal';
import StreakBadge from '../../components/shared/StreakBadge';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import { computeStreak } from '../../lib/streaks';
import { useReminderScheduler } from '../../lib/useReminderScheduler';

// Code-split the heavier tabs (recharts, chat, cycle calendar) out of the
// initial bundle — only Journal and Entries load eagerly.
const InsightsDashboard = React.lazy(() => import('../insights/components/InsightsDashboard'));
const GoalsView = React.lazy(() => import('../goals/components/GoalsView'));
const ChatView = React.lazy(() => import('../chat/components/ChatView'));
const ResourcesPanel = React.lazy(() => import('../resources/components/ResourcesPanel'));
const CycleView = React.lazy(() => import('../cycle/components/CycleView'));

// Grouped to match the nav drawer mockup: a primary "journaling flow" group
// (write, review, reflect) and a secondary group of standalone tools.
const PRIMARY_NAV = [
  { id: 'journal', label: 'Write', caption: 'tonight' },
  { id: 'entries', label: 'Entries', caption: "all you've saved" },
  { id: 'insights', label: 'Insights', caption: 'patterns' },
  { id: 'chat', label: 'Ask your journal', caption: 'last 30 days' },
];

const SECONDARY_NAV = [
  { id: 'goals', label: 'Goals', caption: 'small habits' },
  { id: 'resources', label: 'Resources', caption: 'guided topics' },
];

const CYCLE_TAB = { id: 'cycle', label: 'Cycle', caption: 'private' };

const sectionTitle = {
  journal: 'Write',
  entries: 'Entries',
  insights: 'Insights',
  cycle: 'Cycle & period',
  goals: 'Streak & habits',
  chat: 'Ask your journal',
  resources: 'Resources',
};

const sectionSubtitle = {
  journal: 'Write freely—saving runs a quick analysis for mood, emotions, and themes.',
  entries: "Your library. Find, edit, tidy or export anything you've written.",
  insights: 'Week, month, and year views for mood mix, tone, and activities—all scoped to the range you pick.',
  cycle: 'Mark period start and end on the calendar, track symptoms and mood, and compare journal tone on period days vs other days.',
  goals: 'Show up nightly and draw your constellation. Keep a short list of habits on the side.',
  chat: 'Answers come only from what you’ve written in the last 30 days, and always show which entries they used.',
  resources: 'Short, self-guided reads and exercises. Not a substitute for professional care.',
};

const DashboardLoader = () => (
  <Card className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-4 px-6">
    <svg className="h-10 w-10 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <CardContent className="p-0">
      <p className="text-emote-muted text-muted-foreground">Loading your journal…</p>
    </CardContent>
  </Card>
);

const Dashboard = ({ user }) => {
  const [entries, setEntries] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [cyclePeriods, setCyclePeriods] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('journal');
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const streak = React.useMemo(() => computeStreak(entries), [entries]);

  useReminderScheduler({ user, profile, entries, cyclePeriods });

  const secondaryTabs = React.useMemo(
    () => (profile?.sex === 'female' ? [CYCLE_TAB, ...SECONDARY_NAV] : SECONDARY_NAV),
    [profile?.sex],
  );

  const loadProfile = React.useCallback(async () => {
    if (!supabase || !user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) {
      console.error('Profile load:', error);
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    if (!data) {
      await supabase.from('profiles').upsert({ id: user.id, email: user.email || '' }, { onConflict: 'id' });
      const { data: d2 } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(mapProfileRow(d2));
    } else {
      setProfile(mapProfileRow(data));
    }
    setProfileLoading(false);
    // Depend on the stable primitives, not the `user` object itself — Supabase
    // hands App.js a fresh session/user object on every auth event (including
    // redundant ones for the same already-logged-in user), and depending on
    // the whole object here re-ran this fetch each time, stacking up several
    // concurrent /profiles requests that then contended with each other and
    // made the sidebar's Cycle tab (gated on profile.sex) take visibly longer
    // to appear after sign-in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  const loadCyclePeriods = React.useCallback(async () => {
    if (!supabase || !user?.id) {
      setCyclePeriods([]);
      return;
    }
    const { data, error } = await supabase
      .from('cycle_periods')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(120);
    if (error) {
      if (!`${error.message}`.includes('cycle_periods')) console.error('Cycle periods:', error);
      setCyclePeriods([]);
      return;
    }
    setCyclePeriods((data || []).map(mapCyclePeriodRow));
  }, [user?.id]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  React.useEffect(() => {
    if (profile?.sex === 'female') loadCyclePeriods();
    else setCyclePeriods([]);
  }, [profile?.sex, loadCyclePeriods]);

  React.useEffect(() => {
    if (activeTab === 'cycle' && profile?.sex !== 'female') {
      setActiveTab('journal');
    }
  }, [activeTab, profile?.sex]);

  const loadEntries = React.useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching entries:', error);
      return;
    }
    setEntries((data || []).map(mapJournalRow));
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) return;
    if (!supabase) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      await loadEntries();
      if (!cancelled) setIsLoading(false);
    })();

    const channel = supabase
      .channel(`journal_entries:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Merge the changed row into state instead of refetching the
          // whole list — saving/editing one entry no longer re-downloads
          // the entire journal history.
          if (payload.eventType === 'INSERT') {
            const row = mapJournalRow(payload.new);
            setEntries((prev) =>
              prev.some((e) => e.id === row.id)
                ? prev
                : [row, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
            );
          } else if (payload.eventType === 'UPDATE') {
            const row = mapJournalRow(payload.new);
            // Upsert, not just replace: if the INSERT event was missed (an entry saved
            // while the realtime channel was still connecting), the analysis update that
            // follows still brings the entry into view instead of leaving it hidden.
            setEntries((prev) =>
              prev.some((e) => e.id === row.id)
                ? prev.map((e) => (e.id === row.id ? row : e))
                : [row, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            setEntries((prev) => prev.filter((e) => e.id !== deletedId));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadEntries]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleDeleteEntry = async (entryId) => {
    if (!supabase || !user?.id || !entryId) return;
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);
    if (error) console.error('Delete entry error:', error);
  };

  return (
    <AppShell
      primaryTabs={PRIMARY_NAV}
      secondaryTabs={secondaryTabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenSettings={() => {
        setShowSettingsModal(true);
        setMobileNavOpen(false);
      }}
      onLogout={handleLogout}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
      title={sectionTitle[activeTab] || 'Write'}
      subtitle={sectionSubtitle[activeTab] || sectionSubtitle.journal}
      headerExtra={!isLoading ? <StreakBadge {...streak} /> : null}
    >
      {!isLoading && !profileLoading && profile && !profile.profileCompletedAt ? (
        <ProfileSetupModal user={user} initialProfile={profile} onComplete={loadProfile} />
      ) : null}
      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        entries={entries}
        profile={profile}
        onProfileUpdated={loadProfile}
      />

      {activeTab === 'journal' ? (
        // Journal doesn't depend on `entries`, so writing is never
        // blocked behind the entries/profile load.
        <ErrorBoundary resetKey={activeTab}>
          <JournalView user={user} />
        </ErrorBoundary>
      ) : isLoading ? (
        <DashboardLoader />
      ) : (
        <ErrorBoundary resetKey={activeTab}>
          <React.Suspense fallback={<DashboardLoader />}>
            {activeTab === 'entries' && (
              <EntriesView entries={entries} onDeleteEntry={handleDeleteEntry} onNewEntry={() => setActiveTab('journal')} />
            )}
            {activeTab === 'insights' && <InsightsDashboard entries={entries} user={user} />}
            {activeTab === 'cycle' && profile?.sex === 'female' ? (
              <CycleView user={user} entries={entries} cyclePeriods={cyclePeriods} onPeriodsUpdated={loadCyclePeriods} />
            ) : null}
            {activeTab === 'goals' && (
              <GoalsView entries={entries} user={user} onWriteTonight={() => setActiveTab('journal')} />
            )}
            {activeTab === 'chat' && <ChatView entries={entries} />}
            {activeTab === 'resources' && (
              <ResourcesPanel entries={entries} onWriteEntry={() => setActiveTab('journal')} />
            )}
          </React.Suspense>
        </ErrorBoundary>
      )}
    </AppShell>
  );
};

export default Dashboard;
