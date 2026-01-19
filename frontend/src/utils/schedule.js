import { isFriday, isWithinInterval, startOfDay } from "date-fns";

// Dec 20, 2025 to Jan 4, 2026 (inclusive) is the break.
const XMAS_BREAK_START = new Date(2025, 11, 20); // Month is 0-indexed: 11 = Dec
const XMAS_BREAK_END = new Date(2026, 0, 4); // 0 = Jan

export const isChristmasBreak = (date) => {
  return isWithinInterval(date, {
    start: XMAS_BREAK_START,
    end: XMAS_BREAK_END,
  });
};

export const isNoClassDay = (date, sectionId) => {
  // Christmas Break (General Rule)
  if (isChristmasBreak(date)) {
    return { isBlocked: true, reason: "Christmas Break" };
  }

  const day = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  if (!sectionId) return { isBlocked: false, reason: null };
  const s = sectionId.toString();

  // 1st Year Rule: No classes on Fridays (Mon-Thu allowed)
  if (s.startsWith("1")) {
    if (day === 5) return { isBlocked: true, reason: "No Class (Friday)" };
    // 1st year default: Mon-Thu allowed.
  }

  // 2nd Year Rule: Only Monday (1) & Tuesday (2) allowed
  // So block Wednesday(3), Thursday(4), Friday(5)
  if (s.startsWith("2")) {
    if (day !== 1 && day !== 2) {
      // If not Mon or Tue, it's blocked (excluding weekends which are handled separately elsewhere, typically)
      // But attendance table usually checks isSunday/isSaturday separately.
      // Our `isNoClassDay` is specifically for "No Class" logic on non-weekends visually.
      // Table logic: isBlocked = isHol || isSun || isSat || noClass.isBlocked.
      // So if we return true here for Wed-Fri, it works.
      if (day >= 3 && day <= 5)
        return { isBlocked: true, reason: "No Class (Sched)" };
    }
  }

  // 3rd Year Rule: Only Wednesday (3) & Thursday (4) allowed
  // So block Mon(1), Tue(2), Fri(5)
  if (s.startsWith("3")) {
    if (day === 1 || day === 2 || day === 5) {
      return { isBlocked: true, reason: "No Class (Sched)" };
    }
  }

  return { isBlocked: false, reason: null };
};
