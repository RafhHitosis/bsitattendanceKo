import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/hybrid-db";
import { ref, onValue, set } from "../lib/hybrid-db";
import {
  MIDTERM_START,
  MIDTERM_END,
  FINALS_START,
  FINALS_END,
} from "../utils/dateUtils";

const DEFAULT_SECTIONS = {
  "1st Year": ["101", "102", "103", "104"],
  "2nd Year": ["201", "202", "203"],
  "3rd Year": ["301"],
};

export const useSettings = () => {
  const [termDates, setTermDates] = useState({
    midtermStart: MIDTERM_START.toISOString(),
    midtermEnd: MIDTERM_END.toISOString(),
    finalsStart: FINALS_START.toISOString(),
    finalsEnd: FINALS_END.toISOString(),
  });

  const [appConfig, setAppConfig] = useState({
    title: "BSIT 25-26",
    sections: DEFAULT_SECTIONS,
    schedules: {},
  });

  const [loading, setLoading] = useState(true);

  // Load Config
  useEffect(() => {
    const configRef = ref(db, "config");
    const unsub = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.termDates) setTermDates(data.termDates);

        setAppConfig({
          title: data.appTitle || "BSIT 25-26",
          sections: data.sections || DEFAULT_SECTIONS,
          schedules: data.classSchedules || {},
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateTermDates = useCallback(async (newDates) => {
    await set(ref(db, "config/termDates"), newDates);
  }, []);

  const updateAppTitle = useCallback(async (title) => {
    await set(ref(db, "config/appTitle"), title);
  }, []);

  const updateSections = useCallback(async (sections) => {
    await set(ref(db, "config/sections"), sections);
  }, []);

  const updateClassSchedules = useCallback(async (schedules) => {
    await set(ref(db, "config/classSchedules"), schedules);
  }, []);

  return {
    termDates,
    updateTermDates,
    appConfig,
    updateAppTitle,
    updateSections,
    updateClassSchedules,
    loading,
  };
};
