import React from 'react';

const LoadingScreen = () => (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white" role="status" aria-label="Loading application">
        <div className="flex flex-col items-center gap-6">
            {/* Enhanced loading animation */}
            <div className="relative">
                <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {/* Pulsing inner circle */}
                <div className="absolute inset-3 bg-purple-500 rounded-full animate-pulse opacity-30"></div>
            </div>
            
            {/* App name with subtle animation */}
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2 animate-pulse">
                    EMOTE
                </h1>
                <p className="text-gray-400 text-sm">
                    Your emotional wellness companion
                </p>
            </div>
            
            {/* Loading dots */}
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    </div>
);

export default LoadingScreen; 