import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import JournalView from './JournalView';
import InsightsDashboard from './InsightsDashboard';
import ResourcesView from './ResourcesView';

const Dashboard = ({ user }) => {
    const [entries, setEntries] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('journal');

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
                </nav>
            </div>
            <main>
                {isLoading ? (
                    <div className="flex justify-center items-center p-10"><p className="text-gray-400">Loading your data...</p></div>
                ) : activeTab === 'journal' ? (
                    <JournalView entries={entries} user={user} />
                ) : activeTab === 'insights' ? (
                    <InsightsDashboard entries={entries} />
                ) : (
                    <ResourcesView entries={entries} />
                )}
            </main>
        </div>
    );
};

export default Dashboard; 