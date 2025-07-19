import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default Modal; 