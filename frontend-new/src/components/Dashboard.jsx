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
        <div className="min-h-screen w-full bg-black text-white">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center pb-6 border-b border-gray-800 mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Emote</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 hidden sm:block font-medium animate-fade-in">{user.email}</span>
                        <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#a78bfa]" title="Settings">
                            <FiSettings className="w-6 h-6" />
                        </button>
                        <button onClick={handleLogout} className="bg-gradient-to-r from-[#a78bfa] to-[#f5eafe] text-black font-bold py-2 px-5 rounded-full shadow-lg shadow-[#a78bfa]/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#f5eafe]">Log Out</button>
                    </div>
                </header>
                {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} user={user} />}
                <div className="mt-6">
                    <nav className="flex space-x-2 sm:space-x-4 border-b border-gray-800">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-2 sm:px-4 font-semibold text-sm sm:text-base transition-all duration-300 focus:outline-none relative ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                {tab.label}
                                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#a78bfa] to-[#f5eafe] rounded-full"></span>}
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