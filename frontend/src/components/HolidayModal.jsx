import React, { useState } from "react";
import { X, Calendar, Plus, Trash2, Settings } from "lucide-react";
import { format } from "date-fns";

export default function HolidayModal({
  isOpen,
  onClose,
  customHolidays,
  addHoliday,
  removeHoliday,
  termDates,
  onUpdateTermDates,
  onDeleteAllStudents,
  hasStudents,
}) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (date && name) {
      addHoliday(date, name);
      setDate("");
      setName("");
    }
  };

  const handleDateChange = (key, value) => {
    onUpdateTermDates((prev) => ({ ...prev, [key]: value }));
  };

  const formatDateForInput = (d) => {
    if (!d) return "";
    try {
      return format(new Date(d), "yyyy-MM-dd");
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-700">
            <Settings className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Term Dates Section */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Term Schedules
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  Midterm Start
                </label>
                <input
                  type="date"
                  className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={formatDateForInput(termDates?.midtermStart)}
                  onChange={(e) =>
                    handleDateChange("midtermStart", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  Midterm End
                </label>
                <input
                  type="date"
                  className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={formatDateForInput(termDates?.midtermEnd)}
                  onChange={(e) =>
                    handleDateChange("midtermEnd", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  Finals Start
                </label>
                <input
                  type="date"
                  className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={formatDateForInput(termDates?.finalsStart)}
                  onChange={(e) =>
                    handleDateChange("finalsStart", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  Finals End
                </label>
                <input
                  type="date"
                  className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={formatDateForInput(termDates?.finalsEnd)}
                  onChange={(e) =>
                    handleDateChange("finalsEnd", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Custom Holidays Section */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Manage Custom Holidays
            </h4>

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 mb-4"
            >
              <input
                type="date"
                required
                className="h-9 border border-slate-300 rounded px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-36 shadow-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                type="text"
                placeholder="Name (e.g. Holy Week)"
                required
                className="flex-1 h-9 w-0 border border-slate-300 rounded px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="submit"
                className="h-9 px-3 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors shrink-0 shadow-sm text-xs gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
                Custom Holidays List
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {customHolidays.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 italic text-xs">
                    No custom holidays added yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {customHolidays.map((holiday) => (
                      <li
                        key={holiday.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-sm">
                            {holiday.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(holiday.date), "MMMM d, yyyy")}
                          </span>
                        </div>
                        <button
                          onClick={() => removeHoliday(holiday.id)}
                          className="text-slate-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all cursor-pointer"
                          title="Remove Holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
          <hr className="border-slate-100" />

          {/* Danger Zone */}
          <section>
            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h4>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100 flex items-center justify-between">
              <div>
                <h5 className="font-bold text-red-700 text-sm">
                  Delete All Students
                </h5>
                <p className="text-xs text-red-600/80 mt-1">
                  Permanently remove all students in this section.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onDeleteAllStudents();
                }}
                disabled={!hasStudents}
                className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
