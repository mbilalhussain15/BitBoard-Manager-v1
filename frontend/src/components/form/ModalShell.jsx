import React from "react";

export default function ModalShell({
  isOpen,
  onClose = () => {},
  title,
  children,
  footer = null,
  maxWidthClass = "max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-[820px]",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/50" onClick={onClose} />

      {/* Centering wrapper: mobile -> top; ≥sm -> center */}
      <div className="relative z-10 flex min-h-screen items-start sm:items-center justify-center p-4 sm:p-6">
        {/* Dialog container */}
        <div
          className={`w-full ${maxWidthClass} bg-white dark:bg-zinc-800 rounded-xl shadow-2xl ring-1 ring-black/5
                      mt-6 sm:mt-0 flex flex-col max-h-[90vh]`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
