import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import JournalView from './JournalView';
import InsightsDashboard from './InsightsDashboard';
import ResourcesView from './ResourcesView';
import GoalsView from './GoalsView';
import SettingsModal from './SettingsModal';

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
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">EMOTE</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 hidden sm:block">{user.email}</span>
                    {/* New Settings Button */}
                    <button onClick={() => setShowSettingsModal(true)} title="Settings" className="text-gray-400 hover:text-white transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button onClick={handleLogout} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Log Out
                    </button>
                </div>
            </header>
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('journal')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'journal' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Journal</button>
                    <button onClick={() => setActiveTab('insights')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'insights' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Insights</button>
                    <button onClick={() => setActiveTab('resources')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'resources' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Resources</button>
                    <button onClick={() => setActiveTab('goals')} className={`py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'goals' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>Goals</button>
                </nav>
            </div>
            <main>
                {isLoading ? (
                    <div className="flex justify-center items-center p-10"><p className="text-gray-400">Loading your data...</p></div>
                ) : activeTab === 'journal' ? (
                    <JournalView entries={entries} user={user} />
                ) : activeTab === 'insights' ? (
                    <InsightsDashboard entries={entries} />
                ) : activeTab === 'resources' ? (
                    <ResourcesView entries={entries} />
                ) : (
                    <GoalsView entries={entries} user={user} />
                )}
            </main>
            {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} user={user} entries={entries} />}
        </div>
    );
};

export default Dashboard; 