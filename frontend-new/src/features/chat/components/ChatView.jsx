import React, { useState, useEffect, useRef } from 'react';
import { getCreatedAtDate } from '../../../lib/models/entryDates';
import { getChatResponse } from '../../../lib/services/gemini';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';

const SUGGESTED_QUESTIONS = [
  'What keeps coming up when I’m stressed?',
  'What has helped on hard days?',
  'What have I been worried about lately?',
];

const ChatView = ({ entries }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question) => {
    if (!question.trim() || isLoading) return;
    const userMessage = { sender: 'user', text: question };
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

    const aiResponseText = await getChatResponse(question, entriesText);
    setMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText }]);
    setIsLoading(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    ask(input);
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col animate-fade-in">
      <div className="flex-1 space-y-5">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
              <div
                className="h-9 w-9 shrink-0 rounded-none bg-gradient-to-br from-emote-accent-2 to-emote-accent ring-1 ring-emote-border/80"
                aria-hidden
              />
            )}
            <div
              className={`max-w-[min(100%,32rem)] rounded-none px-4 py-3 text-emote-body leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-emote-surface-alt text-emote-ink'
                  : 'border border-border bg-card text-emote-ink'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-3 justify-start">
            <div className="h-9 w-9 shrink-0 rounded-none bg-gradient-to-br from-emote-accent-2 to-emote-accent opacity-90 ring-1 ring-emote-border/80" aria-hidden />
            <div className="rounded-none border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emote-accent" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-emote-gold [animation-delay:150ms]" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-emote-accent-2 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-8">
        {!hasConversation ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-none border border-border px-4 py-2 text-emote-muted text-emote-ink-soft transition hover:border-emote-border-strong hover:text-emote-ink"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 rounded-none border border-border bg-card px-2 py-2 shadow-emote">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What have I been worried about lately?"
            disabled={isLoading}
            className="flex-1 border-none bg-transparent shadow-none focus:ring-0 disabled:opacity-50"
          />
          <Button type="submit" variant="gradient" disabled={isLoading} className="shrink-0 px-6 disabled:cursor-not-allowed">
            Ask
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
