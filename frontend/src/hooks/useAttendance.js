import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../lib/hybrid-db";
import { ref, onValue, set, push, remove } from "../lib/hybrid-db";
import { format, isSunday, isSaturday } from "date-fns";
import { isDateHoliday } from "../utils/holidays";
import { isNoClassDay } from "../utils/schedule";

export const useAttendance = (dates, sectionId) => {
  // State
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [customHolidays, setCustomHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Custom Holidays (Global)
  useEffect(() => {
    const holidaysRef = ref(db, "holidays");
    const unsub = onValue(holidaysRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setCustomHolidays(list);
      } else {
        setCustomHolidays([]);
      }
    });
    return () => unsub();
  }, []);

  // Load Students and Attendance for specific Section
  useEffect(() => {
    if (!sectionId) return;

    setLoading(true);
    // Path structure: sections/{sectionId}/students
    const studentsRef = ref(db, `sections/${sectionId}/students`);
    // Path structure: sections/{sectionId}/attendance
    const attendanceRef = ref(db, `sections/${sectionId}/attendance`);

    let studentsLoaded = false;
    let attendanceLoaded = false;

    const checkLoading = () => {
      if (studentsLoaded && attendanceLoaded) {
        setLoading(false);
      }
    };

    const unsubStudents = onValue(
      studentsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const studentList = Object.entries(data).map(([id, val]) => ({
            id,
            ...val,
          }));
          studentList.sort((a, b) => a.name.localeCompare(b.name));
          setStudents(studentList);
        } else {
          setStudents([]);
        }
        studentsLoaded = true;
        checkLoading();
      },
      (err) => {
        console.error("Firebase student read failed", err);
        setError(err);
        studentsLoaded = true; // failures count as loaded to unblock
        checkLoading();
      },
    );

    const unsubAttendance = onValue(
      attendanceRef,
      (snapshot) => {
        const data = snapshot.val();
        setAttendance(data || {});
        attendanceLoaded = true;
        checkLoading();
      },
      (err) => {
        console.error("Firebase attendance read failed", err);
        setError(err);
        attendanceLoaded = true;
        checkLoading();
      },
    );

    const timeout = setTimeout(() => setLoading(false), 3000);

    return () => {
      unsubStudents();
      unsubAttendance();
      clearTimeout(timeout);
    };
  }, [sectionId]);

  // Derive loading state from data presence if needed, but simplest is to keep explicit loading
  // We need to know when STUDENTS are loaded to avoid flash.
  // The onValue callback for students runs asynchronously.
  // Let's rely on the student list logic: if students is empty array, it might be initial load or actual empty.
  // But we default loading=true.
  // We need to set loading=false ONLY after we've received data.
  // Since we have two streams, let's wait for the students stream specifically for the "flash" issue.

  const addStudent = useCallback(
    async (name) => {
      if (!sectionId) return;
      const studentsRef = ref(db, `sections/${sectionId}/students`);
      const newStudentRef = push(studentsRef);
      await set(newStudentRef, { name });
    },
    [sectionId],
  );

  const updateStudent = useCallback(
    async (id, name) => {
      if (!sectionId) return;
      const studentRef = ref(db, `sections/${sectionId}/students/${id}`);
      await set(studentRef, { name });
    },
    [sectionId],
  );

  const deleteStudent = useCallback(
    async (id) => {
      if (!sectionId) return;
      const studentRef = ref(db, `sections/${sectionId}/students/${id}`);
      await remove(studentRef);
    },
    [sectionId],
  );

  const deleteAllStudents = useCallback(async () => {
    if (!sectionId) return;
    const studentsRef = ref(db, `sections/${sectionId}/students`);
    await remove(studentsRef);
  }, [sectionId]);

  const toggleAttendance = useCallback(
    async (studentId, date) => {
      if (!sectionId) return;

      // Strict validation: Prevent writes on blocked days
      const { isBlocked } = isNoClassDay(date, sectionId);
      const holidayCheck = isDateHoliday(date, customHolidays);

      if (
        isBlocked ||
        holidayCheck.isHoliday ||
        isSunday(date) ||
        isSaturday(date)
      ) {
        return;
      }

      const dateKey = format(date, "yyyy-MM-dd");
      const recordRef = ref(
        db,
        `sections/${sectionId}/attendance/${dateKey}/${studentId}`,
      );

      const isAbsent = attendance[dateKey]?.[studentId];

      if (isAbsent) {
        await remove(recordRef);
      } else {
        await set(recordRef, true); // Mark as absent
      }
    },
    [sectionId, attendance, customHolidays],
  ); // Dependent on attendance state for toggle logic? actually firebase read is better but we use local state for speed. Wait, attendance changes often.

  const resetAttendance = useCallback(async () => {
    if (!sectionId) return;
    const attendanceRef = ref(db, `sections/${sectionId}/attendance`);
    await remove(attendanceRef);
  }, [sectionId]);

  const addCustomHoliday = useCallback(async (date, name) => {
    const holidaysRef = ref(db, "holidays");
    const newRef = push(holidaysRef);
    await set(newRef, { date, name });
  }, []);

  const removeCustomHoliday = useCallback(async (id) => {
    const holidayRef = ref(db, `holidays/${id}`);
    await remove(holidayRef);
  }, []);

  const batchAddStudents = useCallback(
    async (names) => {
      if (!sectionId) return;
      const studentsRef = ref(db, `sections/${sectionId}/students`);
      for (const name of names) {
        await push(studentsRef, { name });
      }
    },
    [sectionId],
  );

  // Compute Stats with memo optimization
  const stats = useMemo(
    () =>
      students.map((student) => {
        let totalAbsences = 0;
        let totalPresent = 0;

        dates.forEach((date) => {
          const { isBlocked } = isNoClassDay(date, sectionId);
          const holidayName = isDateHoliday(date, customHolidays).isHoliday;

          if (holidayName || isSunday(date) || isSaturday(date) || isBlocked)
            return;

          const dateKey = format(date, "yyyy-MM-dd");
          const isAbsent = attendance[dateKey]?.[student.id];

          if (isAbsent) {
            totalAbsences++;
          } else {
            totalPresent++;
          }
        });

        return {
          studentId: student.id,
          totalAbsences,
          totalPresent,
        };
      }),
    [students, dates, attendance, customHolidays, sectionId],
  );

  const totalSchoolDays = useMemo(
    () =>
      dates.filter(
        (d) =>
          !isDateHoliday(d, customHolidays).isHoliday &&
          !isSunday(d) &&
          !isSaturday(d) &&
          !isNoClassDay(d, sectionId).isBlocked,
      ).length,
    [dates, customHolidays, sectionId],
  );

  return {
    students,
    attendance,
    customHolidays,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
    addCustomHoliday,
    removeCustomHoliday,
    toggleAttendance,
    resetAttendance,
    batchAddStudents,
    stats,
    totalSchoolDays,
    error,
  };
};
