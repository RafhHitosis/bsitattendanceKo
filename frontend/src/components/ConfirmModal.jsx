import React from "react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDestructive = false,
  hideCancel = false,
  confirmText = "Confirm",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="bg-surface rounded-2xl shadow-elevation-3 max-w-sm w-full p-6 transform transition-all scale-100 opacity-100 border border-outline-variant/20"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-on-surface mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          {!hideCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 text-sm font-bold rounded-full transition-colors shadow-sm cursor-pointer ${
              isDestructive
                ? "bg-error text-on-error hover:bg-error/90"
                : "bg-primary text-on-primary hover:bg-primary/90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
