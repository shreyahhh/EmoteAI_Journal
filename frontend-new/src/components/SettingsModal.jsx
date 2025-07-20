import React, { useState, useEffect } from 'react';

// --- Updated Component: Settings Modal with Export ---
const SettingsModal = ({ onClose, user, entries }) => { // Pass 'entries' as a prop
    // State to track if notifications are enabled and the set time.
    const [remindersEnabled, setRemindersEnabled] = useState(localStorage.getItem('remindersEnabled') === 'true');
    const [reminderTime, setReminderTime] = useState(localStorage.getItem('reminderTime') || '21:00');
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [isExporting, setIsExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    useEffect(() => {
        if (notificationPermission === 'granted') {
            localStorage.setItem('remindersEnabled', remindersEnabled);
            if(remindersEnabled) {
                console.log(`Reminders are enabled for ${reminderTime}. A real app would schedule this.`);
            } else {
                 console.log("Reminders are disabled.");
            }
        }
    }, [remindersEnabled, reminderTime, notificationPermission]);

    const handleRequestPermission = () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                setNotificationPermission(permission);
                if (permission === "granted") {
                    setRemindersEnabled(true); // Automatically enable reminders on grant
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
            setRemindersEnabled(prev => !prev);
        }
    };

    // --- Export Logic ---
    const handleExport = async (format) => {
        setIsExporting(true);
        setExportMessage(`Preparing your ${format.toUpperCase()} file...`);

        let fileContent = '';
        let mimeType = '';
        let fileExtension = format;

        if (format === 'json') {
            fileContent = JSON.stringify(entries, null, 2);
            mimeType = 'application/json';
        } else if (format === 'txt') {
            mimeType = 'text/plain';
            fileContent = entries.map(entry => {
                const date = entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : 'N/A';
                return `--------------------\nDate: ${date}\nTitle: ${entry.title || 'Untitled'}\nMood: ${entry.mood}\n\n${entry.content}`;
            }).join('\n\n');
        } else if (format === 'csv') {
            mimeType = 'text/csv';
            const header = 'date,title,mood,content,sentimentScore,emotions,themes\n';
            const rows = entries.map(entry => {
                const date = entry.createdAt?.toDate ? entry.createdAt.toDate().toISOString() : '';
                const content = `"${entry.content.replace(/"/g, '""')}"`;
                const emotions = `"${entry.emotions?.join(', ')}"`;
                const themes = `"${entry.themes?.join(', ')}"`;
                return [date, entry.title, entry.mood, content, entry.sentimentScore, emotions, themes].join(',');
            }).join('\n');
            fileContent = header + rows;
        }

        // Create a Blob and trigger download
        const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `emote_journal_export.${fileExtension}`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        setIsExporting(false);
        setExportMessage(`Your export is complete!`);
        setTimeout(() => setExportMessage(''), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
                </div>

                <div className="space-y-6">
                    {/* Reminders Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-purple-400">Daily Journaling Reminders</h3>
                        {notificationPermission !== 'granted' ? (
                            <div className="bg-yellow-500/20 p-4 rounded-lg text-yellow-300">
                                <p className="font-semibold mb-2">Enable Notifications</p>
                                <p className="text-sm mb-3">To use reminders, you need to allow EMOTE to send notifications in your browser.</p>
                                <button onClick={handleRequestPermission} className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg w-full">
                                    Allow Notifications
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="reminder-toggle" className="text-white font-medium">Enable Daily Reminder</label>
                                    <button
                                        id="reminder-toggle"
                                        onClick={handleToggleReminders}
                                        className={`w-12 h-6 rounded-full flex items-center transition-colors ${remindersEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${remindersEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                    </button>
                                </div>
                                {remindersEnabled && (
                                    <div className="mt-4">
                                        <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-400 mb-1">Reminder Time</label>
                                        <input
                                            type="time"
                                            id="reminder-time"
                                            value={reminderTime}
                                            onChange={handleTimeChange}
                                            className="w-full p-2 bg-gray-600 rounded-lg border border-gray-500 text-white"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- New Data Export Section --- */}
                    <div>
                        <h3 className="text-lg font-semibold text-purple-400 mb-2">Data Export</h3>
                        <div className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                            <p className="text-sm text-gray-400">Download a complete copy of your journal entries.</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={() => handleExport('json')} disabled={isExporting} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">Export as JSON</button>
                                <button onClick={() => handleExport('txt')} disabled={isExporting} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">Export as TXT</button>
                                <button onClick={() => handleExport('csv')} disabled={isExporting} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">Export as CSV</button>
                            </div>
                            {exportMessage && (
                                <p className="text-center text-green-400 text-sm mt-3">{exportMessage}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal; 