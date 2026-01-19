import { eachDayOfInterval, format, startOfDay, isSunday } from "date-fns";
import { isHoliday } from "./holidays";

// Term Dates
export const MIDTERM_START = new Date(2025, 10, 24); // Nov 24, 2025
export const MIDTERM_END = new Date(2026, 1, 15); // Feb 15, 2026

export const FINALS_START = new Date(2026, 1, 16); // Feb 16, 2026
export const FINALS_END = new Date(2026, 3, 15); // April 15, 2026 (Month is 0-indexed: 3 = April)

export const generateDates = (start, end) => {
  const days = eachDayOfInterval({ start, end });
  // We keep Sundays now so no dates appear "missing", but we will treat them as non-school days in the UI/Logic
  return days;
};

export const generateMidtermDates = () =>
  generateDates(MIDTERM_START, MIDTERM_END);
export const generateFinalsDates = () =>
  generateDates(FINALS_START, FINALS_END);

export const groupDatesByMonth = (dates) => {
  const groups = {};
  dates.forEach((date) => {
    const monthKey = format(date, "MMMM");
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(date);
  });
  return groups;
};

export const chunkDates = (dates, size = 2) => {
  const chunks = [];
  for (let i = 0; i < dates.length; i += size) {
    chunks.push(dates.slice(i, i + size));
  }
  return chunks;
};
