import React, { useState, useEffect, useRef } from 'react';
import { getCreatedAtDate } from '../lib/entryDates';

async function getChatResponseWithAI(question, entriesText) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
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
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
      return result.candidates[0].content.parts[0].text;
    }
    return "I'm having a little trouble thinking right now. Please try asking again.";
  } catch (error) {
    console.error('AI Chat Error:', error);
    return "Sorry, I couldn't connect. Please check your connection and try again.";
  }
}

const ChatView = ({ entries }) => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi — I'm Emote. Ask me anything about your journal from the last 30 days." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEntries = entries.filter((entry) => {
      const d = getCreatedAtDate(entry);
      return d && d > thirtyDaysAgo;
    });
    const entriesText = recentEntries
      .map((e) => {
        const d = getCreatedAtDate(e);
        return `Date: ${d ? d.toLocaleDateString() : '?'}\nContent: ${e.content}`;
      })
      .join('\n\n');

    const aiResponseText = await getChatResponseWithAI(input, entriesText);
    setMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText }]);
    setIsLoading(false);
  };

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <p className="mb-4 text-emote-muted leading-relaxed text-slate-500">
        The assistant only sees text from your recent journal entries—if something is missing, write about it first, then ask again.
      </p>
    <div className="flex h-[min(75vh,640px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-emote">
      <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
              <div
                className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 via-rose-400 to-amber-400 ring-1 ring-slate-200/80"
                aria-hidden
              />
            )}
            <div
              className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-emote-body leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-rose-500 via-orange-400 to-amber-500 text-white ring-1 ring-orange-300/40'
                  : 'border border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-3 justify-start">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 via-rose-400 to-amber-400 opacity-90 ring-1 ring-slate-200/80" aria-hidden />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-rose-400 [animation-delay:150ms]" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-emote-canvas p-4">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your journal…"
            disabled={isLoading}
            className="emote-input flex-1 disabled:opacity-50"
          />
          <button type="submit" disabled={isLoading} className="emote-btn-primary shrink-0 px-8 disabled:cursor-not-allowed">
            Send
          </button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default ChatView;
