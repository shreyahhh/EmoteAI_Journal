import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import ChatView from './ChatView';

const ChatPage = ({ entries, onBack }) => {
    return (
        <div className="min-h-screen w-full bg-black text-white">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex items-center gap-4 pb-6 border-b border-gray-800 mb-6">
                    <button 
                        onClick={onBack}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#a78bfa]"
                        title="Back to Dashboard"
                    >
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Chat</h1>
                </header>

                <div className="animate-fade-in">
                    <ChatView entries={entries} />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
