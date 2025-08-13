import React from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingScreen from './components/LoadingScreen';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ResourcesPage from './components/ResourcesPage';
import InsightsPage from './components/InsightsPage';
import TimelinePage from './components/TimelinePage';
import GoalsPage from './components/GoalsPage';
import ChatPage from './components/ChatPage';

export default function App() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState('login'); // 'login', 'signup', 'dashboard', 'resources', 'insights', 'timeline', 'goals', 'chat'
    const [entries, setEntries] = React.useState([]);

    React.useEffect(() => {
        if (!auth) {
            console.error("Firebase auth is not initialized. Please check your Firebase configuration.");
            setLoading(false);
            setPage('login');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setPage('dashboard');
            } else {
                setPage('login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const navigateTo = (pageName) => {
        setPage(pageName);
    };

    const handleNavigateToResources = (userEntries) => {
        setEntries(userEntries);
        setPage('resources');
    };

    const handleNavigateToInsights = (userEntries) => {
        setEntries(userEntries);
        setPage('insights');
    };

    const handleNavigateToTimeline = (userEntries) => {
        setEntries(userEntries);
        setPage('timeline');
    };

    const handleNavigateToGoals = (userEntries) => {
        setEntries(userEntries);
        setPage('goals');
    };

    const handleNavigateToChat = (userEntries) => {
        setEntries(userEntries);
        setPage('chat');
    };

    const handleBackToDashboard = () => {
        setPage('dashboard');
    };
    
    if (loading) {
        return <LoadingScreen />;
    }

    switch (page) {
        case 'signup':
            return <AuthPage isLogin={false} navigateTo={navigateTo} />;
        case 'dashboard':
            return user ? <Dashboard user={user} onNavigateToResources={handleNavigateToResources} onNavigateToInsights={handleNavigateToInsights} onNavigateToTimeline={handleNavigateToTimeline} onNavigateToGoals={handleNavigateToGoals} onNavigateToChat={handleNavigateToChat} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
        case 'resources':
            return user ? <ResourcesPage entries={entries} onBack={handleBackToDashboard} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
        case 'insights':
            return user ? <InsightsPage entries={entries} onBack={handleBackToDashboard} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
        case 'timeline':
            return user ? <TimelinePage entries={entries} onBack={handleBackToDashboard} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
        case 'goals':
            return user ? <GoalsPage entries={entries} user={user} onBack={handleBackToDashboard} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
        case 'chat':
            return user ? <ChatPage entries={entries} onBack={handleBackToDashboard} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
        case 'login':
        default:
            return <AuthPage isLogin={true} navigateTo={navigateTo} />;
    }
} 