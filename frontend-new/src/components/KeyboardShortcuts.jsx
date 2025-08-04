import React, { useEffect } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      
      for (const shortcut of shortcuts) {
        const matches = 
          shortcut.key === key &&
          !!shortcut.ctrl === (ctrlKey || metaKey) &&
          !!shortcut.shift === shiftKey &&
          !!shortcut.alt === altKey;
          
        if (matches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'New journal entry' },
    { keys: ['Ctrl', 'S'], description: 'Save entry' },
    { keys: ['Ctrl', '1'], description: 'Journal tab' },
    { keys: ['Ctrl', '2'], description: 'Insights tab' },
    { keys: ['Ctrl', '3'], description: 'Timeline tab' },
    { keys: ['Ctrl', '4'], description: 'Goals tab' },
    { keys: ['Ctrl', '5'], description: 'Chat tab' },
    { keys: ['Ctrl', '6'], description: 'Resources tab' },
    { keys: ['Escape'], description: 'Close modal/dialog' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
            aria-label="Close shortcuts modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-sm text-gray-600">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded text-gray-700"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          Press <kbd className="px-1 bg-gray-100 rounded">?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
};

export { useKeyboardShortcuts, KeyboardShortcutsModal };