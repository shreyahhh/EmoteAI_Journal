import React, { useState, useEffect } from 'react';
import { getCreatedAtDate } from '../lib/entryDates';

const SettingsModal = ({ onClose, user, entries }) => {
  const [remindersEnabled, setRemindersEnabled] = useState(localStorage.getItem('remindersEnabled') === 'true');
  const [reminderTime, setReminderTime] = useState(localStorage.getItem('reminderTime') || '21:00');
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    if (notificationPermission === 'granted') {
      localStorage.setItem('remindersEnabled', remindersEnabled);
    }
  }, [remindersEnabled, reminderTime, notificationPermission]);

  const handleRequestPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          setRemindersEnabled(true);
        }
      });
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    localStorage.setItem('reminderTime', newTime);
  };

  const handleToggleReminders = () => {
    if (notificationPermission !== 'granted') {
      handleRequestPermission();
    } else {
      setRemindersEnabled((prev) => !prev);
    }
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    setExportMessage(`Preparing ${format.toUpperCase()}…`);
    const safeEntries = entries || [];

    let fileContent = '';
    let mimeType = '';
    const fileExtension = format;

    if (format === 'json') {
      fileContent = JSON.stringify(safeEntries, null, 2);
      mimeType = 'application/json';
    } else if (format === 'txt') {
      mimeType = 'text/plain';
      fileContent = safeEntries
        .map((entry) => {
          const d = getCreatedAtDate(entry);
          const date = d ? d.toLocaleString() : 'N/A';
          return `--------------------\nDate: ${date}\nTitle: ${entry.title || 'Untitled'}\nMood: ${entry.mood}\n\n${entry.content}`;
        })
        .join('\n\n');
    } else if (format === 'csv') {
      mimeType = 'text/csv';
      const header = 'date,title,mood,content,sentimentScore,emotions,themes\n';
      const rows = safeEntries
        .map((entry) => {
          const d = getCreatedAtDate(entry);
          const date = d ? d.toISOString() : '';
          const content = `"${(entry.content || '').replace(/"/g, '""')}"`;
          const emotions = `"${entry.emotions?.join(', ') || ''}"`;
          const themes = `"${entry.themes?.join(', ') || ''}"`;
          return [date, entry.title, entry.mood, content, entry.sentimentScore, emotions, themes].join(',');
        })
        .join('\n');
      fileContent = header + rows;
    }

    const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `emote_journal_export.${fileExtension}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setIsExporting(false);
    setExportMessage('Export complete.');
    setTimeout(() => setExportMessage(''), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-emote shadow-emote-glow">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="settings-title" className="emote-title-gradient text-emote-section">
              Settings
            </h2>
            {user?.email && <p className="mt-1 truncate text-emote-muted text-slate-500">{user.email}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="emote-icon-btn h-9 w-9"
            aria-label="Close settings"
          >
            <span className="text-emote-section leading-none text-slate-500">&times;</span>
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-slate-500">Daily reminder</h3>
            {notificationPermission !== 'granted' ? (
              <div className="emote-banner-info">
                <p className="mb-1 text-emote-muted font-semibold text-sky-900">Browser notifications</p>
                <p className="mb-3 text-emote-muted text-sky-800/90">Allow notifications for a gentle nudge to journal.</p>
                <button type="button" onClick={handleRequestPermission} className="emote-btn-primary w-full">
                  Allow notifications
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-emote-muted font-medium text-slate-800">Enable daily reminder</span>
                  <button
                    type="button"
                    id="reminder-toggle"
                    onClick={handleToggleReminders}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${remindersEnabled ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-slate-300'}`}
                    aria-pressed={remindersEnabled}
                  >
                    <span
                      className={`absolute top-1 left-1 block h-5 w-5 rounded-full bg-white shadow transition-transform ${remindersEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
                {remindersEnabled && (
                  <div className="mt-4">
                    <label htmlFor="reminder-time" className="mb-1.5 block text-emote-caption font-medium text-slate-500">
                      Time
                    </label>
                    <input
                      type="time"
                      id="reminder-time"
                      value={reminderTime}
                      onChange={handleTimeChange}
                      className="emote-input w-auto"
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-slate-500">Export data</h3>
            <p className="mb-3 text-emote-muted text-slate-500">Download a copy of your journal entries.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="emote-btn-ghost flex-1 justify-center disabled:opacity-40"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => handleExport('txt')}
                disabled={isExporting}
                className="emote-btn-ghost flex-1 justify-center disabled:opacity-40"
              >
                TXT
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="emote-btn-ghost flex-1 justify-center disabled:opacity-40"
              >
                CSV
              </button>
            </div>
            {exportMessage && <p className="mt-3 text-center text-emote-muted font-medium text-teal-600">{exportMessage}</p>}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
