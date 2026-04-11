import React from 'react';
import { supabase, mapJournalRow } from '../supabaseClient';
import JournalView from './JournalView';
import EntriesView from './EntriesView';
import InsightsDashboard from './InsightsDashboard';
import TimelineView from './TimelineView';
import GoalsView from './GoalsView';
import ChatView from './ChatView';
import ResourcesPanel from './ResourcesPanel';
import SettingsModal from './SettingsModal';
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
} from 'react-icons/fi';

const navItems = [
  { id: 'journal', label: 'Journal', icon: FiBookOpen },
  { id: 'entries', label: 'Entries', icon: FiList },
  { id: 'insights', label: 'Insights', icon: FiBarChart2 },
  { id: 'timeline', label: 'Timeline', icon: FiCalendar },
  { id: 'goals', label: 'Goals', icon: FiTarget },
  { id: 'chat', label: 'Chat', icon: FiMessageCircle },
  { id: 'resources', label: 'Resources', icon: FiLayers },
];

const sectionTitle = {
  journal: 'Journal',
  entries: 'Entries',
  insights: 'Insights',
  timeline: 'Timeline',
  goals: 'Goals',
  chat: 'Chat',
  resources: 'Resources',
};

const sectionSubtitle = {
  journal: 'Write freely—saving runs a quick analysis for mood, emotions, and themes.',
  entries: 'Everything you have saved, newest first. Delete from the card menu if you need to.',
  insights: 'Spot patterns in mood, sentiment over time, and how activities line up with how you felt.',
  timeline: 'A month-by-month trail of entries—tap one to read it in full.',
  goals: 'Keep a short list of habits; suggestions appear when your journal themes repeat.',
  chat: 'Ask about your own words—replies use entries from roughly the last 30 days only.',
  resources: 'Guided topics for common feelings; recommendations follow themes in recent entries.',
};

const DashboardLoader = () => (
  <div className="flex min-h-[min(420px,70vh)] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 shadow-emote">
    <svg
      className="h-10 w-10 animate-spin text-orange-500"
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
    <p className="text-emote-muted text-slate-500">Loading your journal…</p>
  </div>
);

function NavList({
  activeTab,
  onSelect,
  onCloseMobile,
  className = '',
}) {
  return (
    <nav className={`flex flex-col gap-0.5 ${className}`} aria-label="Main navigation">
      {navItems.map((tab) => {
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
            <Icon className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
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
  const [activeTab, setActiveTab] = React.useState('journal');
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

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
        () => {
          loadEntries();
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
    <div className={`shrink-0 ${compact ? 'mt-auto border-t border-slate-100 pt-4' : 'border-t border-slate-100 p-4'}`}>
      <p
        className={`truncate text-emote-caption text-slate-500 ${compact ? 'px-1' : 'px-0'}`}
        title={user.email}
      >
        {user.email}
      </p>
      <div className={`mt-3 flex gap-2 ${compact ? '' : ''}`}>
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
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-emote-canvas text-slate-800 lg:flex-row">
      <div className="emote-mesh" aria-hidden />

      {/* Desktop sidebar — viewport height, does not scroll with main */}
      <aside
        className="relative z-20 hidden h-full min-h-0 w-[300px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex"
        aria-label="Sidebar"
      >
          <div className="flex h-[4.25rem] items-center border-b border-slate-100 px-5">
            <span className="emote-title-gradient text-emote-page font-bold tracking-tight">Emote</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
              <NavList activeTab={activeTab} onSelect={handleNavSelect} className="shrink-0" />
            </div>
            <UserFooter compact />
          </div>
      </aside>

      <div className="emote-main-canvas min-w-0 pt-14 lg:pt-0">
        {showSettingsModal && (
          <SettingsModal onClose={() => setShowSettingsModal(false)} user={user} entries={entries} />
        )}

        <div className="emote-main-scroll">
          <header className="mb-6 border-b border-slate-200/80 pb-5 lg:mb-8">
            <h2 className="text-emote-page font-semibold tracking-tight text-slate-900">
              {sectionTitle[activeTab] || 'Journal'}
            </h2>
            <p className="mt-2 max-w-2xl text-emote-muted leading-relaxed text-slate-500">
              {sectionSubtitle[activeTab] || sectionSubtitle.journal}
            </p>
          </header>

            <main className="animate-fade-in">
              {isLoading ? (
                <DashboardLoader />
              ) : (
                <>
                  {activeTab === 'journal' && <JournalView user={user} />}
                  {activeTab === 'entries' && (
                    <EntriesView entries={entries} onDeleteEntry={handleDeleteEntry} />
                  )}
                  {activeTab === 'insights' && <InsightsDashboard entries={entries} />}
                  {activeTab === 'timeline' && <TimelineView entries={entries} />}
                  {activeTab === 'goals' && <GoalsView entries={entries} user={user} />}
                  {activeTab === 'chat' && <ChatView entries={entries} />}
                  {activeTab === 'resources' && <ResourcesPanel entries={entries} />}
                </>
              )}
            </main>
        </div>
      </div>

      {/* Mobile header */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="emote-icon-btn"
          aria-label="Open menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <span className="emote-title-gradient text-emote-section font-bold">Emote</span>
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="emote-icon-btn"
          aria-label="Settings"
        >
          <FiSettings className="h-5 w-5" />
        </button>
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
          <div className="fixed inset-y-0 left-0 z-50 flex w-[min(320px,92vw)] flex-col border-r border-slate-200 bg-white shadow-xl lg:hidden animate-fade-in">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-emote-card-title font-semibold text-slate-800">Menu</span>
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
