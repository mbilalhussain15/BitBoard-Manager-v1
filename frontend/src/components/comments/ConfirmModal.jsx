import React from "react";

export default function ConfirmModal({ onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-md rounded-lg bg-[#1b1b1b] border border-gray-700 p-6 text-gray-100">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-600/15 flex items-center justify-center">
          <span className="text-2xl">🗑️</span>
        </div>
        <p className="text-center text-sm">
          Are you sure you want to delete this comment
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-700 text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
