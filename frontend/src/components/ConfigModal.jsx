import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Edit2,
  Settings,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function ConfigModal({ isOpen, onClose, config, onSave }) {
  const [localConfig, setLocalConfig] = useState(config);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: "",
    defaultValue: "",
    onConfirm: () => {},
  });

  const [scheduleModal, setScheduleModal] = useState({
    isOpen: false,
    sectionId: "",
    days: [], // [0, 1, 2...]
  });

  // Initialize helper state on open
  React.useEffect(() => {
    if (isOpen && config) {
      setLocalConfig(JSON.parse(JSON.stringify(config))); // Deep copy
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const closeConfirmModal = () =>
    setDeleteModal((prev) => ({ ...prev, isOpen: false }));
  const closeInputModal = () =>
    setInputModal((prev) => ({ ...prev, isOpen: false }));
  const closeScheduleModal = () =>
    setScheduleModal((prev) => ({ ...prev, isOpen: false }));

  const handleEditScheduleRequest = (sectionId) => {
    const currentSchedule = localConfig.schedules?.[sectionId] || [
      1, 2, 3, 4, 5,
    ]; // Default Mon-Fri
    setScheduleModal({
      isOpen: true,
      sectionId,
      days: currentSchedule,
    });
  };

  const handleScheduleToggle = (dayIndex) => {
    setScheduleModal((prev) => {
      const currentDays = prev.days;
      if (currentDays.includes(dayIndex)) {
        return {
          ...prev,
          days: currentDays.filter((d) => d !== dayIndex).sort(),
        };
      } else {
        return { ...prev, days: [...currentDays, dayIndex].sort() };
      }
    });
  };

  const executeSaveSchedule = () => {
    const { sectionId, days } = scheduleModal;
    setLocalConfig((prev) => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [sectionId]: days,
      },
    }));
    closeScheduleModal();
  };

  const handleTitleChange = (e) => {
    setLocalConfig((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleSectionChange = (yearName, newSections) => {
    setLocalConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [yearName]: newSections,
      },
    }));
  };

  const executeRenameYear = (oldName, newName) => {
    if (oldName === newName) return;
    if (localConfig.sections[newName]) {
      alert("Year name already exists!");
      return;
    }

    const newSectionsObj = {};
    Object.keys(localConfig.sections).forEach((key) => {
      if (key === oldName) {
        newSectionsObj[newName] = localConfig.sections[oldName];
      } else {
        newSectionsObj[key] = localConfig.sections[key];
      }
    });

    setLocalConfig((prev) => ({ ...prev, sections: newSectionsObj }));
    closeInputModal();
  };

  const handleRenameYearRequest = (yearName) => {
    setInputModal({
      isOpen: true,
      title: "Rename Year Level",
      defaultValue: yearName,
      onConfirm: (newName) => executeRenameYear(yearName, newName),
    });
  };

  const handleAddYear = () => {
    const newName = "New Year Level";
    if (localConfig.sections[newName]) {
      let i = 1;
      while (localConfig.sections[`${newName} ${i}`]) i++;
      const uniqueName = `${newName} ${i}`;
      setLocalConfig((prev) => ({
        ...prev,
        sections: { ...prev.sections, [uniqueName]: [] },
      }));
    } else {
      setLocalConfig((prev) => ({
        ...prev,
        sections: { ...prev.sections, [newName]: [] },
      }));
    }
  };

  const executeDeleteYear = (yearName) => {
    const newSectionsObj = { ...localConfig.sections };
    delete newSectionsObj[yearName];
    setLocalConfig((prev) => ({ ...prev, sections: newSectionsObj }));
    closeConfirmModal();
  };

  const handleDeleteYearRequest = (yearName) => {
    setDeleteModal({
      isOpen: true,
      title: "Delete Year Level?",
      message: `Are you sure you want to delete "${yearName}" and all its sections?`,
      onConfirm: () => executeDeleteYear(yearName),
    });
  };

  const executeAddSection = (yearName, sectionName) => {
    if (sectionName) {
      const currentSections = localConfig.sections[yearName] || [];
      if (currentSections.includes(sectionName)) return;
      handleSectionChange(yearName, [...currentSections, sectionName].sort());
    }
    closeInputModal();
  };

  const handleAddSectionRequest = (yearName) => {
    setInputModal({
      isOpen: true,
      title: `Add Section to ${yearName}`,
      defaultValue: "",
      onConfirm: (val) => executeAddSection(yearName, val),
    });
  };

  const executeRenameSection = (yearName, oldSection, newSection) => {
    if (newSection && newSection !== oldSection) {
      const currentSections = localConfig.sections[yearName];
      const updated = currentSections
        .map((s) => (s === oldSection ? newSection : s))
        .sort();
      handleSectionChange(yearName, updated);
    }
    closeInputModal();
  };

  const handleRenameSectionRequest = (yearName, oldSection) => {
    setInputModal({
      isOpen: true,
      title: "Rename Section",
      defaultValue: oldSection,
      onConfirm: (val) => executeRenameSection(yearName, oldSection, val),
    });
  };

  const executeDeleteSection = (yearName, sectionName) => {
    const currentSections = localConfig.sections[yearName];
    const updated = currentSections.filter((s) => s !== sectionName);
    handleSectionChange(yearName, updated);
    closeConfirmModal();
  };

  const handleDeleteSectionRequest = (yearName, sectionName) => {
    setDeleteModal({
      isOpen: true,
      title: "Delete Section?",
      message: `Remove Section "${sectionName}"?`,
      onConfirm: () => executeDeleteSection(yearName, sectionName),
    });
  };

  const save = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        onCancel={closeConfirmModal}
        isDestructive={true}
        confirmText="Delete"
      />

      {/* Schedule Modal */}
      {scheduleModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Schedule: Section {scheduleModal.sectionId}
              </h4>
              <button
                onClick={closeScheduleModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Select class days for this section.
            </p>

            <div className="space-y-2 mb-6">
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, idx) => {
                const isSelected = scheduleModal.days.includes(idx);
                return (
                  <div
                    key={day}
                    onClick={() => handleScheduleToggle(idx)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all ${isSelected ? "bg-emerald-50 border-emerald-200" : "hover:bg-slate-50 border-transparent"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-300"}`}
                    >
                      {isSelected && <CheckSquare className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${isSelected ? "text-emerald-900" : "text-slate-600"}`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeScheduleModal}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeSaveSchedule}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer font-bold"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Modal */}
      {inputModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4">
              {inputModal.title}
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.inputValue.value.trim();
                if (val) inputModal.onConfirm(val);
              }}
            >
              <input
                name="inputValue"
                defaultValue={inputModal.defaultValue}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeInputModal}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700">
            <Settings className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold">App Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              App Title (School Year)
            </label>
            <input
              type="text"
              value={localConfig.title}
              onChange={handleTitleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase">
                Year Levels & Sections
              </label>
              <button
                onClick={handleAddYear}
                className="text-xs flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Year Level
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(localConfig.sections || {}).map(
                ([yearName, sections]) => (
                  <div
                    key={yearName}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-slate-700">
                        {yearName}
                      </span>

                      <button
                        onClick={() => handleRenameYearRequest(yearName)}
                        className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDeleteYearRequest(yearName)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Delete Year"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {sections.map((section) => (
                        <div
                          key={section}
                          className="group relative bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-sm"
                        >
                          <span className="font-medium text-slate-700">
                            {section}
                          </span>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button
                              onClick={() => handleEditScheduleRequest(section)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer"
                              title="Edit Schedule"
                            >
                              <Calendar className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                handleRenameSectionRequest(yearName, section)
                              }
                              className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                              title="Rename Section"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSectionRequest(yearName, section)
                              }
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete Section"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddSectionRequest(yearName)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-300 transition-colors text-sm cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Section
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
