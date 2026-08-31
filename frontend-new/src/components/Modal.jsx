import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-emote-border bg-emote-surface p-6 shadow-emote shadow-emote-glow">
        <h3 className="text-emote-card-title font-semibold text-emote-ink">{title}</h3>
        <p className="mt-2 text-emote-muted text-emote-ink-soft">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="emote-btn-ghost px-5 py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-800/90 px-5 py-2 text-emote-muted font-semibold text-emote-surface transition hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-800/50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
