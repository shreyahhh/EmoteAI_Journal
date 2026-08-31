import React from 'react';
import { supabase, mapJournalRow, mapProfileRow, mapCyclePeriodRow } from '../supabaseClient';
import JournalView from './JournalView';
import EntriesView from './EntriesView';
import SettingsModal from './SettingsModal';
import ProfileSetupModal from './ProfileSetupModal';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import {
  FiSettings,
  FiMenu,
  FiX,
  FiBookOpen,
  FiList,
  FiBarChart2,
  FiCalendar,
  FiTarget,
  FiMessageCircle,
  FiLayers,
  FiDroplet,
} from 'react-icons/fi';

// Code-split the heavier tabs (recharts, chat, cycle calendar) out of the
// initial bundle — only Journal and Entries load eagerly.
const InsightsDashboard = React.lazy(() => import('./InsightsDashboard'));
const TimelineView = React.lazy(() => import('./TimelineView'));
const GoalsView = React.lazy(() => import('./GoalsView'));
const ChatView = React.lazy(() => import('./ChatView'));
const ResourcesPanel = React.lazy(() => import('./ResourcesPanel'));
const CycleView = React.lazy(() => import('./CycleView'));

const BASE_NAV = [
  { id: 'journal', label: 'Journal', icon: FiBookOpen },
  { id: 'entries', label: 'Entries', icon: FiList },
  { id: 'insights', label: 'Insights', icon: FiBarChart2 },
  { id: 'timeline', label: 'Timeline', icon: FiCalendar },
  { id: 'goals', label: 'Goals', icon: FiTarget },
  { id: 'chat', label: 'Chat', icon: FiMessageCircle },
  { id: 'resources', label: 'Resources', icon: FiLayers },
];

const CYCLE_TAB = { id: 'cycle', label: 'Cycle', icon: FiDroplet };

const sectionTitle = {
  journal: 'Journal',
  entries: 'Entries',
  insights: 'Insights',
  cycle: 'Cycle & period',
  timeline: 'Timeline',
  goals: 'Goals',
  chat: 'Chat',
  resources: 'Resources',
};

const sectionSubtitle = {
  journal: 'Write freely—saving runs a quick analysis for mood, emotions, and themes.',
  entries: 'Everything you have saved, newest first. Delete from the card menu if you need to.',
  insights: 'Week, month, and year views for mood mix, tone, and activities—all scoped to the range you pick.',
  cycle: 'Mark period start and end on the calendar, track symptoms and mood, and compare journal tone on period days vs other days.',
  timeline: 'A month-by-month trail of entries—tap one to read it in full.',
  goals: 'Keep a short list of habits; suggestions appear when your journal themes repeat.',
  chat: 'Ask about your own words—replies use entries from roughly the last 30 days only.',
  resources: 'Guided topics for common feelings; recommendations follow themes in recent entries.',
};

const DashboardLoader = () => (
  <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-4 rounded-2xl border border-emote-border bg-emote-surface px-6 shadow-emote">
    <svg
      className="h-10 w-10 animate-spin text-emote-accent"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <p className="text-emote-muted text-emote-ink-faint">Loading your journal…</p>
  </div>
);

function NavList({
  tabs,
  activeTab,
  onSelect,
  onCloseMobile,
  className = '',
}) {
  return (
    <nav className={`flex flex-col gap-0.5 ${className}`} aria-label="Main navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => {
              onSelect(tab.id);
              onCloseMobile?.();
            }}
            className={`emote-sidenav-link ${isActive ? 'emote-sidenav-link-active' : ''}`}
          >
            <Icon className="h-5 w-5 shrink-0 text-emote-ink-faint" aria-hidden />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const Dashboard = ({ user }) => {
  const [entries, setEntries] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [cyclePeriods, setCyclePeriods] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('journal');
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const navTabs = React.useMemo(() => {
    if (profile?.sex === 'female') {
      const out = [...BASE_NAV];
      const ins = out.findIndex((t) => t.id === 'insights');
      out.splice(ins + 1, 0, CYCLE_TAB);
      return out;
    }
    return BASE_NAV;
  }, [profile?.sex]);

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
  }, [user]);

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
            setEntries((prev) => prev.map((e) => (e.id === row.id ? row : e)));
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

  React.useEffect(() => {
    if (mobileNavOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

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

  const handleNavSelect = (tabId) => {
    setActiveTab(tabId);
  };

  const UserFooter = ({ compact }) => (
    <div className={`shrink-0 ${compact ? 'mt-auto border-t border-emote-border pt-4' : 'border-t border-emote-border p-4'}`}>
      <p
        className={`truncate text-emote-caption text-emote-ink-faint ${compact ? 'px-1' : 'px-0'}`}
        title={user.email}
      >
        {user.email}
      </p>
      <div className={`mt-3 flex gap-2 ${compact ? '' : ''}`}>
        <ThemeToggle className="shrink-0" />
        <button
          type="button"
          onClick={() => {
            setShowSettingsModal(true);
            setMobileNavOpen(false);
          }}
          className="emote-icon-btn shrink-0"
          title="Settings"
          aria-label="Settings"
        >
          <FiSettings className="h-5 w-5" />
        </button>
        <button type="button" onClick={handleLogout} className="emote-btn-primary min-w-0 flex-1">
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-emote-canvas text-emote-ink lg:flex-row">
      <div className="emote-mesh" aria-hidden />

      {/* Desktop sidebar — viewport height, does not scroll with main */}
      <aside
        className="relative z-20 hidden h-full min-h-0 w-[300px] shrink-0 flex-col border-r border-emote-border bg-emote-surface shadow-sm lg:flex"
        aria-label="Sidebar"
      >
          <div className="flex h-[4.25rem] items-center gap-2.5 border-b border-emote-border px-5">
            <Logo size={28} />
            <span className="emote-title-gradient text-emote-page font-bold tracking-tight">Emote</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
              <NavList tabs={navTabs} activeTab={activeTab} onSelect={handleNavSelect} className="shrink-0" />
            </div>
            <UserFooter compact />
          </div>
      </aside>

      <div className="emote-main-canvas min-w-0 pt-14 lg:pt-0">
        {!isLoading && !profileLoading && profile && !profile.profileCompletedAt ? (
          <ProfileSetupModal user={user} initialProfile={profile} onComplete={loadProfile} />
        ) : null}
        {showSettingsModal && (
          <SettingsModal onClose={() => setShowSettingsModal(false)} user={user} entries={entries} />
        )}

        <div className="emote-main-scroll">
          <header className="mb-6 border-b border-emote-border pb-5 lg:mb-8">
            <h2 className="text-emote-page font-semibold tracking-tight text-emote-ink">
              {sectionTitle[activeTab] || 'Journal'}
            </h2>
            <p className="mt-2 max-w-2xl text-emote-muted leading-relaxed text-emote-ink-soft">
              {sectionSubtitle[activeTab] || sectionSubtitle.journal}
            </p>
          </header>

            <main className="animate-fade-in">
              {activeTab === 'journal' ? (
                // Journal doesn't depend on `entries`, so writing is never
                // blocked behind the entries/profile load.
                <JournalView user={user} />
              ) : isLoading ? (
                <DashboardLoader />
              ) : (
                <React.Suspense fallback={<DashboardLoader />}>
                  {activeTab === 'entries' && (
                    <EntriesView entries={entries} onDeleteEntry={handleDeleteEntry} />
                  )}
                  {activeTab === 'insights' && <InsightsDashboard entries={entries} />}
                  {activeTab === 'cycle' && profile?.sex === 'female' ? (
                    <CycleView
                      user={user}
                      entries={entries}
                      cyclePeriods={cyclePeriods}
                      onPeriodsUpdated={loadCyclePeriods}
                    />
                  ) : null}
                  {activeTab === 'timeline' && <TimelineView entries={entries} />}
                  {activeTab === 'goals' && <GoalsView entries={entries} user={user} />}
                  {activeTab === 'chat' && <ChatView entries={entries} />}
                  {activeTab === 'resources' && <ResourcesPanel entries={entries} />}
                </React.Suspense>
              )}
            </main>
        </div>
      </div>

      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-emote-border bg-emote-surface/95 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="emote-icon-btn"
          aria-label="Open menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2">
          <Logo size={22} />
          <span className="emote-title-gradient text-emote-section font-bold">Emote</span>
        </span>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="emote-icon-btn"
            aria-label="Settings"
          >
            <FiSettings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,92vw)] flex-col border-r border-emote-border bg-emote-surface shadow-xl lg:hidden animate-fade-in">
            <div className="flex h-14 items-center justify-between border-b border-emote-border px-4">
              <span className="text-emote-card-title font-semibold text-emote-ink">Menu</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="emote-icon-btn"
                aria-label="Close menu"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-2">
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                <NavList
                  tabs={navTabs}
                  activeTab={activeTab}
                  onSelect={handleNavSelect}
                  onCloseMobile={() => setMobileNavOpen(false)}
                />
              </div>
              <UserFooter compact />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
