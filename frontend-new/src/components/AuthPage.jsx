import React from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const features = [
  {
    icon: '💡',
    title: 'AI Insights',
    desc: 'Instant mood & theme analysis on every entry to uncover patterns in your thoughts and feelings.',
    bg: 'from-purple-900/50 to-purple-800/40',
  },
  {
    icon: '📈',
    title: 'Timeline & Trends',
    desc: 'Visualize your growth and emotional journey over time with interactive charts and a beautiful timeline.',
    bg: 'from-orange-900/50 to-orange-800/40',
  },
  {
    icon: '🎯',
    title: 'Goal Setting',
    desc: 'Set, track, and celebrate your personal wellness goals, with smart suggestions from your AI companion.',
    bg: 'from-teal-900/50 to-teal-800/40',
  },
];

const steps = [
  {
    icon: '✍️',
    title: '1. Journal',
    desc: 'Write your thoughts, feelings, and moments. Use text or your voice, whenever inspiration strikes.',
  },
  {
    icon: '🔍',
    title: '2. Get Insights',
    desc: 'Our AI analyzes your mood, themes, and trends, providing a deeper understanding of your inner world.',
  },
  {
    icon: '🌱',
    title: '3. Grow',
    desc: 'Set goals, track progress, and use personalized resources to thrive and build a healthier mindset.',
  },
];

const AuthPage = ({ isLogin, navigateTo }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!email || !password) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Emote</h1>
          <button
            onClick={() => navigateTo(isLogin ? 'signup' : 'login')}
            className="hidden md:inline-block bg-[#1f2937] text-white font-bold py-2 px-5 rounded-full shadow-md border border-gray-700 hover:bg-gray-700 transition"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden pt-24 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 -z-10" />
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Info */}
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight text-white">
              Your Mind. Your Story. <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Your Growth.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-300 max-w-xl mx-auto md:mx-0">
              Welcome to Emote—the most beautiful, private, and AI-powered journaling experience. Reflect, grow, and thrive with insights tailored just for you.
            </p>
            <a href="#features" className="inline-block mt-8 bg-gradient-to-r from-purple-400 to-orange-400 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all hover:-translate-y-1 hover:shadow-orange-400/20">Learn More</a>
          </div>
          {/* Right Column: Login Form */}
          <div>
            <div className="card p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-center mb-6 text-white">{isLogin ? 'Welcome Back' : 'Create Your Account'}</h3>
              {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-center">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="mt-1 w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="mt-1 w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-400 to-orange-400 text-white font-bold py-3 rounded-full transition-all hover:-translate-y-1 hover:shadow-orange-400/20"
                >
                  {isLoading ? 'Loading...' : (isLogin ? 'Log In' : 'Sign Up')}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-gray-400">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => navigateTo(isLogin ? 'signup' : 'login')} className="font-semibold text-[#a78bfa] hover:text-[#f97316] ml-1">
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-black">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Discover a Deeper Understanding</h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">Emote goes beyond a simple diary, offering powerful tools to help you understand yourself.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className={`card p-8 text-left`}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${f.bg} flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-black">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-white">Simple Steps to a Better You</h2>
          <div className="relative grid md:grid-cols-3 gap-8 items-start">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 rounded-full bg-gray-800 shadow-lg border border-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">{s.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-white">{s.title}</h3>
                <p className="text-gray-400 mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 px-6 border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-500">
          <p>&copy; 2024 Emote. All Rights Reserved.</p>
          <div className="mt-4 space-x-6">
            <a href="#" className="hover:text-[#a78bfa]">Privacy Policy</a>
            <a href="#" className="hover:text-[#a78bfa]">Terms of Service</a>
            <a href="#" className="hover:text-[#a78bfa]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage; 