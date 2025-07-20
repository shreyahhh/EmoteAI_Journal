import React, { useState, useEffect, useRef } from 'react';

// --- New Helper function to get a conversational response from Gemini API ---
async function getChatResponseWithAI(question, entriesText) {
    const apiKey = "AIzaSyA3lz7Bh3KuM2SbwwoDhvRQy5jhShrAxHc"; // Set the Gemini API key directly for testing.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // This prompt instructs the AI to act as a personal journal assistant.
    // It provides the user's question and the context of their journal entries.
    const prompt = `
        You are "Emote," a compassionate and insightful AI assistant for a personal journal app.
        Your user is asking you a question about their past entries.
        Your task is to answer the user's question based *only* on the provided journal entries.
        Do not make up information or provide generic advice. Ground your entire response in the text provided.
        Keep your answer conversational and supportive.

        Here is the user's question:
        "${question}"

        Here are the relevant journal entries from the last 30 days:
        ---
        ${entriesText}
        ---

        Your Answer:
    `;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
            return result.candidates[0].content.parts[0].text;
        } else {
            return "I'm having a little trouble thinking right now. Please try asking again.";
        }
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "Sorry, I couldn't connect to my brain. Please check your connection and try again.";
    }
}

// --- New Component: The Main View for the Chat Tab ---
const ChatView = ({ entries }) => {
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hello! I'm Emote. Ask me anything about your journal entries from the last 30 days." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Effect to scroll to the bottom of the chat on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Filter for entries from the last 30 days and combine them
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentEntries = entries.filter(entry => entry.createdAt && entry.createdAt.toDate() > thirtyDaysAgo);
        const entriesText = recentEntries.map(e => `Date: ${e.createdAt.toDate().toLocaleDateString()}\nContent: ${e.content}`).join('\n\n');
        
        const aiResponseText = await getChatResponseWithAI(input, entriesText);
        const aiMessage = { sender: 'ai', text: aiResponseText };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto h-[75vh] flex flex-col bg-gray-800 rounded-2xl shadow-lg">
            {/* Message Display Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0"></div>}
                        <div className={`max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0"></div>
                        <div className="max-w-lg px-4 py-3 rounded-2xl bg-gray-700 text-gray-300">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your journal..."
                        disabled={isLoading}
                        className="flex-grow p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-white"
                    />
                    <button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:bg-gray-500">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatView; 