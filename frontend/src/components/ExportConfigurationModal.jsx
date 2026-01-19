import React, { useState } from "react";
import { X, FileSpreadsheet } from "lucide-react";

export default function ExportConfigurationModal({
  isOpen,
  onClose,
  onExport,
  sectionId,
  term,
  studentCount,
}) {
  const [config, setConfig] = useState({
    registrarCode: "AR341",
    instructor: "",
    subject: "",
    days: "MT", // Default based on image or common
    time: "10:30AM-12:00NN",
    room: "MB403",
    academicYear: "2025-2026",
    semester: term === "midterm" ? "First Semester" : "Second Semester",
    course: `BSIT-${sectionId}`, // Infer from sectionId
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(config); // Pass config back to handler
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Export Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white hover:bg-emerald-700/50 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {/* Form Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Registrar / Form Code
              </label>
              <input
                type="text"
                name="registrarCode"
                value={config.registrarCode}
                onChange={handleChange}
                placeholder="e.g. AR341"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Instructor & Subject */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Instructor
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={config.instructor}
                  onChange={handleChange}
                  placeholder="e.g. MR. JOHN DOE"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={config.subject}
                  onChange={handleChange}
                  placeholder="e.g. Data Structures"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Schedule Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Days
                </label>
                <input
                  type="text"
                  name="days"
                  value={config.days}
                  onChange={handleChange}
                  placeholder="e.g. MT"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Time
                </label>
                <input
                  type="text"
                  name="time"
                  value={config.time}
                  onChange={handleChange}
                  placeholder="e.g. 10:30AM-12:00NN"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={config.room}
                  onChange={handleChange}
                  placeholder="e.g. MB403"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Acad Year
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={config.academicYear}
                  onChange={handleChange}
                  placeholder="e.g. 2025-2026"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Semester
                </label>
                <input
                  type="text"
                  name="semester"
                  value={config.semester}
                  onChange={handleChange}
                  placeholder="e.g. Second Semester"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Course
                </label>
                <input
                  type="text"
                  name="course"
                  value={config.course}
                  onChange={handleChange}
                  placeholder="e.g. BSIT-202"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Read-only Info */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600 flex justify-between">
              <span>
                <strong>Section:</strong> {sectionId}
              </span>
              <span>
                <strong>Students:</strong> {studentCount}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition-colors cursor-pointer"
            >
              Export Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
