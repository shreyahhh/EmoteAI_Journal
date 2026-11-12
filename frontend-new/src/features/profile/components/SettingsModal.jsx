import React, { useState, useEffect } from 'react';
import { getCreatedAtDate } from '../../../lib/models/entryDates';
import { supabase } from '../../../supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../lib/utils';
import { PALETTES, getStoredPalette, applyPalette } from '../models/profilePalettePreference';
import ReminderPrefsFields from './ReminderPrefsFields';
import CycleSettingsSection from '../../cycle/components/CycleSettingsSection';

const SettingsModal = ({ open, onClose, user, entries, profile, onProfileUpdated }) => {
  const [palette, setPalette] = useState(getStoredPalette);
  const [remindersEnabled, setRemindersEnabled] = useState(profile?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '21:00');
  const [reminderDays, setReminderDays] = useState(profile?.reminderDays || [1, 2, 3, 4, 5]);
  const [planetNotificationsEnabled, setPlanetNotificationsEnabled] = useState(profile?.planetNotificationsEnabled ?? true);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Profile loads async (and can change under us — e.g. after onboarding),
  // so re-sync local state whenever a fresher row arrives instead of only
  // reading it once at mount.
  useEffect(() => {
    if (!profile) return;
    setRemindersEnabled(profile.reminderEnabled ?? false);
    setReminderTime(profile.reminderTime || '21:00');
    setReminderDays(profile.reminderDays || [1, 2, 3, 4, 5]);
    setPlanetNotificationsEnabled(profile.planetNotificationsEnabled ?? true);
  }, [profile]);

  const saveReminderPrefs = async (patch) => {
    if (!supabase || !user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) console.error('Reminder prefs save:', error);
    else onProfileUpdated?.();
  };

  const handleRequestPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          setRemindersEnabled(true);
          saveReminderPrefs({ reminder_enabled: true });
        }
      });
    }
  };

  const handleTimeChange = (newTime) => {
    setReminderTime(newTime);
    saveReminderPrefs({ reminder_time: newTime });
  };

  const handleDaysChange = (newDays) => {
    setReminderDays(newDays);
    saveReminderPrefs({ reminder_days: newDays });
  };

  const handleToggleReminders = (checked) => {
    if (checked && notificationPermission !== 'granted') {
      handleRequestPermission();
    } else {
      setRemindersEnabled(checked);
      saveReminderPrefs({ reminder_enabled: checked });
    }
  };

  const handleTogglePlanetNotifications = async (checked) => {
    setPlanetNotificationsEnabled(checked);
    if (!supabase || !user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ planet_notifications_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) console.error('Planet notifications save:', error);
    else onProfileUpdated?.();
  };

  const handlePaletteChange = (id) => {
    setPalette(id);
    applyPalette(id);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportMessage('Preparing PDF…');
    const safeEntries = entries || [];
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - marginX * 2;
    let y = 56;

    const ensureRoom = (lineHeight) => {
      if (y + lineHeight > pageHeight - 48) {
        doc.addPage();
        y = 56;
      }
    };

    doc.setFontSize(18);
    doc.text('Emote Journal Export', marginX, y);
    y += 28;

    safeEntries.forEach((entry, index) => {
      const d = getCreatedAtDate(entry);
      const date = d ? d.toLocaleString() : 'N/A';

      ensureRoom(20);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(entry.title || 'Untitled entry', marginX, y);
      y += 16;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${date} — mood: ${entry.mood || 'neutral'}`, marginX, y);
      doc.setTextColor(0);
      y += 16;

      doc.setFontSize(10);
      const lines = doc.splitTextToSize(entry.content || '', maxWidth);
      lines.forEach((line) => {
        ensureRoom(14);
        doc.text(line, marginX, y);
        y += 14;
      });

      if (index < safeEntries.length - 1) {
        y += 10;
        ensureRoom(1);
        doc.setDrawColor(200);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 20;
      }
    });

    doc.save('emote_journal_export.pdf');
    setIsExporting(false);
    setExportMessage('Export complete.');
    setTimeout(() => setExportMessage(''), 3000);
  };

  const handleExport = async (format) => {
    if (format === 'pdf') return handleExportPdf();
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="emote-title-gradient">Settings</DialogTitle>
          {user?.email && <p className="mt-1 truncate text-emote-muted text-emote-ink-faint">{user.email}</p>}
        </DialogHeader>

        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Reminders</h3>
            <p className="mb-3 text-emote-muted text-emote-ink-faint">One gentle nudge, never more. Skip a day and nothing happens.</p>
            <div className="space-y-3">
              <ReminderPrefsFields
                idPrefix="settings-reminder"
                enabled={remindersEnabled}
                onEnabledChange={handleToggleReminders}
                time={reminderTime}
                onTimeChange={handleTimeChange}
                days={reminderDays}
                onDaysChange={handleDaysChange}
              />
              {notificationPermission === 'denied' ? (
                <p className="text-emote-caption text-emote-accent">
                  Notifications are blocked for this site in your browser. Allow them in your browser's site settings
                  to turn reminders on.
                </p>
              ) : (
                <p className="text-emote-caption text-emote-ink-faint">
                  {notificationPermission === 'granted'
                    ? 'Browser notifications are on for this device.'
                    : "Turning this on will ask your browser's permission for notifications."}
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Galaxy</h3>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="planet-notifications" className="mb-0 normal-case tracking-normal text-emote-ink">
                Planet notifications
              </Label>
              <Switch id="planet-notifications" checked={planetNotificationsEnabled} onCheckedChange={handleTogglePlanetNotifications} />
            </div>
            <p className="mt-2 text-emote-caption text-emote-ink-faint">
              A short in-app message when an entry joins a planet, or a planet first appears.
            </p>
          </section>

          {profile?.sex === 'female' ? <CycleSettingsSection user={user} /> : null}

          <section>
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Appearance</h3>
            <div className="grid grid-cols-3 gap-3">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePaletteChange(p.id)}
                  aria-pressed={palette === p.id}
                  className={cn(
                    'rounded-none border p-3 text-left transition',
                    palette === p.id ? 'border-emote-accent ring-1 ring-emote-accent' : 'border-emote-border hover:border-emote-border-strong',
                  )}
                >
                  <span className="flex h-12 items-center gap-1.5 rounded-none px-2.5" style={{ backgroundColor: p.canvas }}>
                    {p.dots.map((dot, i) => (
                      <span key={i} className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
                    ))}
                  </span>
                  <span className="mt-2 block text-emote-muted font-medium text-emote-ink">{p.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Export data</h3>
            <p className="mb-3 text-emote-muted text-emote-ink-faint">Download a copy of your journal entries.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="flex-1 justify-center disabled:opacity-40"
              >
                JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExport('txt')}
                disabled={isExporting}
                className="flex-1 justify-center disabled:opacity-40"
              >
                TXT
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="flex-1 justify-center disabled:opacity-40"
              >
                CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex-1 justify-center disabled:opacity-40"
              >
                PDF
              </Button>
            </div>
            {exportMessage && <p className="mt-3 text-center text-emote-muted font-medium text-emote-accent">{exportMessage}</p>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
