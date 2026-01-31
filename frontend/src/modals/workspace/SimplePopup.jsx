import * as React from "react";
import { createPortal } from "react-dom";

export default function SimplePopup({
  open,
  text,
  onClose,
  title = "Description",
}) {
  // Close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // (Optional) prevent body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center p-4 sm:p-6"
      // backdrop (light/dark)
      style={{}}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      />

      {/* Modal */}
      <div
        className="relative mx-auto grid w-[92vw] max-w-lg 
                   rounded-2xl border bg-white text-gray-900 shadow-2xl
                   border-black/10
                   dark:bg-neutral-900 dark:text-neutral-100 dark:border-white/10
                   max-h-[80vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="rounded-lg px-2 py-1 text-sm
                       hover:bg-black/5 active:bg-black/10
                       dark:hover:bg-white/10 dark:active:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content (scrolls if long) */}
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="max-h-[64vh] overflow-y-auto rounded-lg border
                          border-black/5 bg-neutral-50 p-3
                          dark:border-white/10 dark:bg-neutral-800">
            <p className="text-sm text-gray-700 whitespace-pre-wrap
                          dark:text-neutral-200">
              {text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to body to avoid transform/hover jump issues
  return createPortal(node, document.body);
}
