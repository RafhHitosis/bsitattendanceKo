import React, { useMemo, useState, useRef, useEffect } from "react";
import { format, isSameDay, isToday, isSunday, isSaturday } from "date-fns";
import { groupDatesByMonth, chunkDates } from "../utils/dateUtils";
import { isDateHoliday } from "../utils/holidays";
import { isNoClassDay, isChristmasBreak } from "../utils/schedule";
import clsx from "clsx";
import { Plus, User, Trash2, MoreVertical, Edit } from "lucide-react";

export default function AttendanceTable({
  dates,
  students,
  attendance,
  toggleAttendance,
  addStudent,
  deleteStudent,
  editStudent,
  stats,
  sectionId,
  customHolidays,
  totalSchoolDays,
  schedules, // NEW PROP
}) {
  const [newStudentName, setNewStudentName] = useState("");
  const hoverStatusRef = useRef(null); // Ref for status bar

  // Pre-process columns
  const monthGroups = useMemo(() => groupDatesByMonth(dates), [dates]);
  const monthKeys = Object.keys(monthGroups);

  // Calculate pairs for each month
  const monthColumns = useMemo(() => {
    return monthKeys.map((month) => ({
      name: month,
      pairs: chunkDates(monthGroups[month], 2),
    }));
  }, [monthGroups, monthKeys]);

  const handleSubmitStudent = (e) => {
    e.preventDefault();
    if (newStudentName.trim()) {
      addStudent(newStudentName.trim());
      setNewStudentName("");
    }
  };

  const updateHoverStatus = (text) => {
    if (hoverStatusRef.current) {
      hoverStatusRef.current.textContent = text;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
      <div className="flex-1 overflow-auto relative shadow-inner">
        <table className="min-w-full border-collapse border-spacing-0 bg-white text-sm">
          {/* Calendar Header */}
          <thead className="sticky top-0 z-20 bg-white text-slate-800 shadow-sm font-semibold">
            {/* Row 1: Months */}
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-white border border-slate-200 w-12 min-w-[3rem] p-0 text-center h-[34px]">
                NO
              </th>
              <th className="sticky left-12 top-0 z-30 bg-white border border-slate-200 min-w-[200px] text-left px-4 h-[34px]">
                NAME
              </th>
              {monthColumns.map((group) => (
                <th
                  key={group.name}
                  colSpan={group.pairs.length}
                  className={clsx(
                    "sticky top-0 z-20 h-[34px] text-center py-2 border border-slate-200 uppercase tracking-wider text-xs bg-slate-50 font-bold text-slate-700",
                  )}
                >
                  {group.name}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-30 bg-slate-50 border border-slate-200 w-24 p-2 text-center text-xs font-bold text-slate-700 h-[34px]">
                AT
              </th>
            </tr>

            {/* Row 2: Date Pairs */}
            <tr>
              <th className="sticky left-0 top-[34px] z-30 bg-slate-50 border border-slate-200 text-center align-middle">
                <span className="text-[10px] font-bold text-slate-400">
                  {students.length}
                </span>
              </th>
              <th className="sticky left-12 top-[34px] z-30 bg-slate-50 border border-slate-200 p-2">
                <form onSubmit={handleSubmitStudent} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add student..."
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </form>
              </th>

              {monthColumns.map((group) =>
                group.pairs.map((pair, idx) => {
                  // Header Logic: Use schedule if available, else fallback
                  const checkBlocked = (date) => {
                    if (!date) return { isBlocked: false };
                    const day = date.getDay();
                    const schedule = schedules?.[sectionId];

                    // Check Holiday
                    const hol = isDateHoliday(date, customHolidays);
                    if (hol.isHoliday)
                      return {
                        isBlocked: true,
                        reason: hol.name,
                        isHoliday: true,
                        holConfig: hol,
                      };

                    // Check Christmas Break
                    if (isChristmasBreak(date))
                      return { isBlocked: true, reason: "Christmas Break" };

                    // Check Weekend
                    if (isSunday(date) || isSaturday(date))
                      return { isBlocked: true, reason: "Weekend" };

                    // Check Schedule Config (Priority)
                    if (schedule && schedule.length >= 0) {
                      if (!schedule.includes(day))
                        return { isBlocked: true, reason: "No Class (Sched)" };
                      return { isBlocked: false };
                    }

                    // Fallback to legacy hardcoded logic
                    return isNoClassDay(date, sectionId);
                  };

                  const status1 = checkBlocked(pair[0]);
                  const status2 = pair[1]
                    ? checkBlocked(pair[1])
                    : { isBlocked: false };

                  return (
                    <th
                      key={`${group.name}-${idx}`}
                      className="sticky top-[34px] z-20 border border-slate-200 min-w-[3rem] p-0 align-top bg-white"
                    >
                      <div className="flex flex-col h-full">
                        {/* Day 1 */}
                        <div
                          className={clsx(
                            "flex-1 flex items-center justify-center py-1 border-b border-slate-300 text-xs",
                            isToday(pair[0]) &&
                              "bg-emerald-600 text-white font-bold",
                            status1.isHoliday && "bg-red-100 text-red-700",
                            status1.isBlocked &&
                              !status1.isHoliday &&
                              "bg-slate-200 text-slate-500",
                          )}
                          title={`${format(pair[0], "EEEE")}${status1.reason ? ` - ${status1.reason}` : ""}`}
                        >
                          {format(pair[0], "d")}
                        </div>

                        {/* Day 2 */}
                        {pair[1] ? (
                          <div
                            className={clsx(
                              "flex-1 flex items-center justify-center py-1 text-xs",
                              isToday(pair[1]) &&
                                "bg-emerald-600 text-white font-bold",
                              status2.isHoliday && "bg-red-100 text-red-700",
                              status2.isBlocked &&
                                !status2.isHoliday &&
                                "bg-slate-200 text-slate-500",
                            )}
                            title={`${format(pair[1], "EEEE")}${status2.reason ? ` - ${status2.reason}` : ""}`}
                          >
                            {format(pair[1], "d")}
                          </div>
                        ) : (
                          <div className="flex-1 bg-slate-50"></div>
                        )}
                      </div>
                    </th>
                  );
                }),
              )}
              <th className="sticky right-0 top-[34px] z-30 bg-slate-50 border border-slate-200 text-[10px] text-slate-500 p-1">
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="flex-1 w-full flex items-center justify-center border-b border-slate-300">
                    <span className="text-emerald-700 font-bold text-[10px]">
                      PRES
                    </span>
                  </div>
                  <div className="flex-1 w-full flex items-center justify-center">
                    <span className="text-[10px] text-red-500 font-bold">
                      ABS
                    </span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white">
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={100}
                  className="p-8 text-center text-slate-400 italic"
                >
                  No students added yet. Add one above.
                </td>
              </tr>
            )}
            {students.map((student, index) => (
              <StudentRow
                key={student.id}
                student={student}
                index={index}
                stats={stats}
                attendance={attendance}
                monthColumns={monthColumns}
                customHolidays={customHolidays}
                sectionId={sectionId}
                totalSchoolDays={totalSchoolDays}
                toggleAttendance={toggleAttendance}
                deleteStudent={deleteStudent}
                editStudent={editStudent}
                schedules={schedules} // Pass schedules
                onHover={updateHoverStatus} // Pass hover handler
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky Status Bar */}
      <div className="bg-slate-50 text-slate-700 border-t border-slate-200 px-4 py-2 text-xs font-mono font-bold flex items-center justify-between sticky bottom-0 z-40">
        <span className="text-slate-500">STATUS:</span>
        <span
          ref={hoverStatusRef}
          className="mx-2 truncate flex-1 text-center text-emerald-700"
        >
          Ready
        </span>
        <div className="flex gap-4 text-slate-500">
          <span>M: Month</span>
          <span>D: Day</span>
        </div>
      </div>
    </div>
  );
}

const StudentRow = React.memo(
  ({
    student,
    index,
    stats,
    attendance,
    monthColumns,
    customHolidays,
    sectionId,
    totalSchoolDays,
    toggleAttendance,
    deleteStudent,
    editStudent,
    schedules, // New Prop
    onHover, // New Prop
  }) => {
    // ... existing stats logic ...
    const studentStats = stats.find((s) => s.studentId === student.id) || {
      totalAbsences: 0,
      totalPresent: 0,
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    // ... existing Menu useEffect ...
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target) &&
          !buttonRef.current.contains(event.target)
        ) {
          setIsMenuOpen(false);
        }
      };

      if (isMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isMenuOpen]);

    const handleMouseEnter = (date) => {
      if (!date) return;
      const dateStr = format(date, "MMM d (EEEE)");
      onHover(`${student.name.split(",")[0]} • ${dateStr}`);
    };

    return (
      <tr className="hover:bg-slate-100 group transition-colors">
        {/* ... existing cells ... */}
        <td className="sticky left-0 z-10 bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-mono group-hover:bg-slate-200 transition-colors">
          {index + 1}
        </td>
        <td className="sticky left-12 z-10 bg-white group-hover:bg-slate-100 border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 flex justify-between items-center h-[50px] transition-colors">
          <span className="truncate max-w-[150px]">{student.name}</span>
          {/* ... existing menu button ... */}
          <div className="relative ml-2 shrink-0">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={clsx(
                "p-1 rounded-full transition-colors cursor-pointer",
                isMenuOpen
                  ? "bg-red-50 text-red-600"
                  : "text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100",
              )}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute left-full top-0 ml-2 z-[9999] w-32 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-left"
              >
                <div className="flex flex-col py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      editStudent(student);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 w-full text-left transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStudent(student.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>

        {monthColumns.map((group) =>
          group.pairs.map((pair, idx) => {
            const checkBlocked = (date) => {
              if (!date) return { isBlocked: false };
              const day = date.getDay();
              const schedule = schedules?.[sectionId];

              // Check Holiday
              const hol = isDateHoliday(date, customHolidays);
              if (hol.isHoliday)
                return {
                  isBlocked: true,
                  reason: hol.name,
                  isHoliday: true,
                  holConfig: hol,
                };

              // Check Christmas Break
              if (isChristmasBreak(date))
                return { isBlocked: true, reason: "Christmas Break" };

              // Check Weekend
              if (isSunday(date) || isSaturday(date))
                return { isBlocked: true, reason: "Weekend" };

              // Check Schedule Config (Priority)
              if (schedule && schedule.length >= 0) {
                if (!schedule.includes(day))
                  return { isBlocked: true, reason: "No Class (Sched)" };
                return { isBlocked: false };
              }

              // Fallback to legacy hardcoded logic
              return isNoClassDay(date, sectionId);
            };

            const date1 = pair[0];
            const date2 = pair[1];
            const date1Key = format(date1, "yyyy-MM-dd");
            const date2Key = date2 ? format(date2, "yyyy-MM-dd") : null;

            const isAbs1 = attendance[date1Key]?.[student.id];
            const isAbs2 = date2Key && attendance[date2Key]?.[student.id];

            const status1 = checkBlocked(date1);
            const status2 = date2 ? checkBlocked(date2) : { isBlocked: false };

            const title1 = `${format(date1, "EEEE")}${status1.reason ? ` - ${status1.reason}` : isAbs1 ? " - Absent" : " - Present"}`;
            const title2 = date2
              ? `${format(date2, "EEEE")}${status2.reason ? ` - ${status2.reason}` : isAbs2 ? " - Absent" : " - Present"}`
              : "";

            return (
              <td
                key={`${group.name}-${idx}`}
                className="border border-slate-200 p-0 h-[50px] min-w-[3rem]"
              >
                <div className="flex flex-col h-full">
                  {/* Cell 1 */}
                  <div
                    className={clsx(
                      "flex-1 cursor-pointer transition-colors border-b border-slate-300 relative",
                      status1.isBlocked
                        ? "bg-slate-100 cursor-not-allowed"
                        : isAbs1
                          ? "bg-red-500 hover:bg-red-600"
                          : "hover:bg-blue-200 group-hover:bg-blue-200", // Enhanced hover
                      status1.isHoliday && "bg-red-100",
                    )}
                    onClick={() =>
                      !status1.isBlocked && toggleAttendance(student.id, date1)
                    }
                    onMouseEnter={() => handleMouseEnter(date1)}
                    onMouseLeave={() => onHover("")}
                    title={title1}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800/40 opacity-0 group-hover:opacity-100 pointer-events-none select-none">
                      {format(date1, "d")}
                    </span>
                  </div>

                  {/* Cell 2 */}
                  {date2 ? (
                    <div
                      className={clsx(
                        "flex-1 cursor-pointer transition-colors relative",
                        status2.isBlocked
                          ? "bg-slate-100 cursor-not-allowed"
                          : isAbs2
                            ? "bg-red-500 hover:bg-red-600"
                            : "hover:bg-blue-200 group-hover:bg-blue-200", // Enhanced hover
                        status2.isHoliday && "bg-red-100",
                      )}
                      onClick={() =>
                        !status2.isBlocked &&
                        toggleAttendance(student.id, date2)
                      }
                      onMouseEnter={() => handleMouseEnter(date2)}
                      onMouseLeave={() => onHover("")}
                      title={title2}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800/40 opacity-0 group-hover:opacity-100 pointer-events-none select-none">
                        {format(date2, "d")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 bg-slate-100"></div>
                  )}
                </div>
              </td>
            );
          }),
        )}

        {/* ... Stats column ... */}
        <td className="sticky right-0 z-10 bg-slate-50 border border-slate-200 text-center font-bold text-xs group-hover:bg-slate-200 transition-colors">
          <div className="flex flex-col h-full w-full">
            <div className="flex-1 w-full flex items-center justify-center border-b border-slate-300 bg-emerald-50/50 group-hover:bg-emerald-100/50">
              <span className="text-emerald-700 font-bold text-xs">
                {studentStats.totalPresent}
              </span>
            </div>
            <div className="flex-1 w-full flex items-center justify-center bg-red-50/50 group-hover:bg-red-100/50">
              <span className="text-red-600 font-bold text-xs">
                {studentStats.totalAbsences}
              </span>
            </div>
          </div>
        </td>
      </tr>
    );
  },
);
