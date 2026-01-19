import { isSameDay, parseISO } from "date-fns";

// Philippine Holidays (CHED/National)
// Covering late 2025 to early 2026 based on the request timeline
const DEFAULT_HOLIDAYS = [
  { date: "2025-11-30", name: "Bonifacio Day" },
  { date: "2025-12-08", name: "Immaculate Conception" },
  { date: "2025-12-25", name: "Christmas Day" },
  { date: "2025-12-30", name: "Rizal Day" },
  { date: "2025-12-31", name: "Last Day of the Year" },
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-23", name: "First Philippine Republic Day" },
  { date: "2026-02-17", name: "Chinese New Year" },
];

// Helper to check against ONLY static holidays (deprecated usage, better pass dynamic list)
export const isHoliday = (date) => {
  return DEFAULT_HOLIDAYS.some((h) => isSameDay(parseISO(h.date), date));
};

export const getHolidayName = (date) => {
  const holiday = DEFAULT_HOLIDAYS.find((h) =>
    isSameDay(parseISO(h.date), date),
  );
  return holiday ? holiday.name : null;
};

// New Helper: Check against dynamic list + default
export const isDateHoliday = (date, customHolidays = []) => {
  // Check custom first (override)
  const custom = customHolidays.find((h) => isSameDay(parseISO(h.date), date));
  if (custom) return { isHoliday: true, name: custom.name };

  // Check default
  const def = DEFAULT_HOLIDAYS.find((h) => isSameDay(parseISO(h.date), date));
  if (def) return { isHoliday: true, name: def.name };

  return { isHoliday: false, name: null };
};
