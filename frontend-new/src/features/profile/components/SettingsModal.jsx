import React, { useState, useEffect } from 'react';
import { getCreatedAtDate } from '../../../lib/entryDates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';

const SettingsModal = ({ open, onClose, user, entries }) => {
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
            <h3 className="mb-3 text-emote-caption font-semibold uppercase tracking-wide text-emote-ink-faint">Daily reminder</h3>
            {notificationPermission !== 'granted' ? (
              <div className="emote-banner-info">
                <p className="mb-1 text-emote-muted font-semibold text-emote-ink">Browser notifications</p>
                <p className="mb-3 text-emote-muted text-emote-ink/90">Allow notifications for a gentle nudge to journal.</p>
                <Button type="button" variant="gradient" onClick={handleRequestPermission} className="w-full">
                  Allow notifications
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-emote-border bg-emote-surface-alt p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="reminder-toggle" className="mb-0 text-emote-muted font-medium normal-case tracking-normal text-emote-ink">
                    Enable daily reminder
                  </Label>
                  <Switch id="reminder-toggle" checked={remindersEnabled} onCheckedChange={handleToggleReminders} />
                </div>
                {remindersEnabled && (
                  <div className="mt-4">
                    <Label htmlFor="reminder-time">Time</Label>
                    <Input
                      type="time"
                      id="reminder-time"
                      value={reminderTime}
                      onChange={handleTimeChange}
                      className="w-auto"
                    />
                  </div>
                )}
              </div>
            )}
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
