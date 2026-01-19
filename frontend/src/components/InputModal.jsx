import React from "react";

export default function InputModal({
  isOpen,
  title,
  defaultValue = "",
  onConfirm,
  onCancel,
  confirmText = "Save",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-4">{title}</h4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = e.target.elements.inputValue.value.trim();
            if (val) onConfirm(val);
          }}
        >
          <input
            name="inputValue"
            defaultValue={defaultValue}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer font-bold transition-colors shadow-sm"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
