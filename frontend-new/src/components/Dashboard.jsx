import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import JournalView from './JournalView';
import InsightsDashboard from './InsightsDashboard';
import ResourcesView from './ResourcesView';
import GoalsView from './GoalsView';
import SettingsModal from './SettingsModal';
import TimelineView from './TimelineView';
import ChatView from './ChatView';
import LoadingScreen from './LoadingScreen';
import { FiSettings } from 'react-icons/fi';

const tabs = [
  { id: 'journal', label: 'Journal' },
  { id: 'insights', label: 'Insights' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'goals', label: 'Goals' },
  { id: 'chat', label: 'Chat' },
  { id: 'resources', label: 'Resources' },
];

const Dashboard = ({ user }) => {
    const [entries, setEntries] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('journal');
    const [showSettingsModal, setShowSettingsModal] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const entriesCollection = collection(db, 'journal_entries');
        const q = query(entriesCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEntries = [];
            querySnapshot.forEach((doc) => {
                userEntries.push({ id: doc.id, ...doc.data() });
            });
            setEntries(userEntries);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching entries: ", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <div className="min-h-screen w-full bg-[#f3f4f6]">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center pb-6 border-b border-transparent mb-6 bg-transparent">
                    <h1 className="text-5xl font-extrabold font-emote text-[#2563eb] drop-shadow-lg tracking-wide select-none">Emote</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500 hidden sm:block font-medium animate-fade-in">{user.email}</span>
                        <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-full hover:bg-[#e0f2fe] transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#2563eb]" title="Settings">
                            <FiSettings className="w-7 h-7 text-[#2563eb]" />
                        </button>
                        <button onClick={() => signOut(auth)} className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] hover:from-[#2563eb] hover:to-[#0ea5e9] text-[#1e293b] font-bold py-2 px-5 rounded-full shadow-md transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#2563eb]">Log Out</button>
                    </div>
                </header>
                {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} user={user} />}
                <div className="mt-6">
                    <nav className="flex space-x-2 sm:space-x-4 border-b border-[#bae6fd] bg-white/60 rounded-xl shadow-sm px-2 py-1 animate-fade-in">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-2 sm:px-4 font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${activeTab === tab.id ? 'bg-gradient-to-r from-[#2563eb] to-[#0ea5e9] text-white shadow-md scale-105' : 'text-[#2563eb] hover:bg-[#e0f2fe] hover:text-[#f59e42]'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <main className="mt-8 animate-fade-in">
                    {isLoading ? <LoadingScreen /> : (
                        <>
                            {activeTab === 'journal' && <JournalView entries={entries} user={user} />}
                            {activeTab === 'insights' && <InsightsDashboard entries={entries} />}
                            {activeTab === 'timeline' && <TimelineView entries={entries} />}
                            {activeTab === 'goals' && <GoalsView entries={entries} user={user} />}
                            {activeTab === 'chat' && <ChatView entries={entries} />}
                            {activeTab === 'resources' && <ResourcesView entries={entries} />}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard; 