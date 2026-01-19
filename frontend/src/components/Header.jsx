import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, RotateCcw, BookOpen } from "lucide-react";
import clsx from "clsx";

export default function Header({
  resetAttendance,
  schoolDaysCount,
  currentTerm,
  setTerm,
  appTitle,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-surface border-b border-surface-container-high shadow-elevation-1 sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left: Branding & Term Switcher */}
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="bg-primary-container text-on-primary-container p-2 rounded-xl shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-on-surface tracking-tight leading-tight">
                  {appTitle || "Class Attendance"}
                </h1>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  {currentTerm} Period
                </p>
              </div>
            </div>

            {/* Term Toggle */}
            <div className="bg-surface-container-high p-1 rounded-full flex items-center border border-outline-variant/20">
              <button
                onClick={() => setTerm("midterm")}
                className={clsx(
                  "px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer",
                  currentTerm === "midterm"
                    ? "bg-primary text-on-primary shadow-elevation-1"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50",
                )}
              >
                MIDTERM
              </button>
              <button
                onClick={() => setTerm("finals")}
                className={clsx(
                  "px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer",
                  currentTerm === "finals"
                    ? "bg-primary text-on-primary shadow-elevation-1"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50",
                )}
              >
                FINALS
              </button>
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg border border-secondary-container text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{schoolDaysCount} Days</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container text-xs font-medium text-on-surface-variant tabular-nums">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">
                {format(currentDate, "MMM do, yyyy")} •
              </span>
              <span>{format(currentDate, "h:mm:ss a")}</span>
            </div>

            <button
              onClick={resetAttendance}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-error bg-surface hover:bg-error-container hover:text-on-error-container rounded-full transition-colors border border-outline-variant/30 shadow-sm cursor-pointer"
              title="Reset all data"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
