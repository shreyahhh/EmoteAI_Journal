import React from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingScreen from './components/LoadingScreen';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState('login'); // 'login', 'signup', 'dashboard'

    React.useEffect(() => {
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
    
    if (loading) {
        return (
            <ErrorBoundary>
                <LoadingScreen />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            {(() => {
                switch (page) {
                    case 'signup':
                        return <AuthPage isLogin={false} navigateTo={navigateTo} />;
                    case 'dashboard':
                        return user ? <Dashboard user={user} /> : <AuthPage isLogin={true} navigateTo={navigateTo} />;
                    case 'login':
                    default:
                        return <AuthPage isLogin={true} navigateTo={navigateTo} />;
                }
            })()}
        </ErrorBoundary>
    );
} 