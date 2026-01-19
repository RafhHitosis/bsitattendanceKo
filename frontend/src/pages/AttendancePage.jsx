import React, { useMemo, useState } from "react";
import Header from "../components/Header";
import AttendanceTable from "../components/AttendanceTable";
import ConfirmModal from "../components/ConfirmModal";
import { useAttendance } from "../hooks/useAttendance";
import { useSettings } from "../hooks/useSettings";
import {
  generateMidtermDates,
  generateFinalsDates,
  MIDTERM_START,
  MIDTERM_END,
  FINALS_START,
  FINALS_END,
  generateDates,
} from "../utils/dateUtils";
import {
  ArrowLeft,
  Upload,
  CalendarPlus,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import HolidayModal from "../components/HolidayModal";
import InputModal from "../components/InputModal";
import { exportToExcel } from "../utils/exportUtils";
import ExportConfigurationModal from "../components/ExportConfigurationModal";

const STUDENTS_101 = [
  "ALBANIA, Aeron Jesus M.",
  "ALVARADO, Nina Jinky A.",
  "BIDON, Renee Aphrodite D.",
  "CUASAY, Francis Joram Y.",
  "CUETO, Marvin C.",
  "DENSO, Kyle Andrie V.",
  "ESPADA, Alexsandra R.",
  "FAMINIALAGAO, Jade Clemens R.",
  "FOJAS, Jamaica I.",
  "GAID, Crystal Jade F.",
  "GUTIERREZ, Lawrence F.",
  "ISLER, James Andrei S.",
  "MANATO, Ivan Lloyd F.",
  "MAPANO, Jessa Mae A.",
  "MATINING, Dariane Jasmine A.",
  "MATIRA, John Carlo M.",
  "MONREAL, Jhon Rey C.",
  "ONA, Christine M.",
  "PACIA, Tricia Lyn C.",
  "PERALTA, John Ceasar A.",
  "PEREZ, Carlo Glenn M.",
  "REVADINERA, Alex P.",
  "ROCO, Eman F.",
  "SANTIAGO, Zeus D.",
  "SEMILLA, Rosemarie G.",
  "SEVILLA, Mhiel I.",
  "TAYCO, Jhon Lloyd S.",
];

const STUDENTS_102 = [
  "ALVA, Edgar L.",
  "BENEDICTO, Nelson D.",
  "CHOMLING, Lean Shaemae C.",
  "COLINDON, Charlie Mae G.",
  "COMIA, Jusrelle Mae G.",
  "DALINO, Ben Mico S.",
  "DE GUZMAN, Chariel R.",
  "DELACION, Jemlex D.",
  "DELIGANZO, Shiela Mae F.",
  "FRONDA, Mark Anthony B.",
  "GABAYNO, Emerald S.",
  "GABAYNO, Larry G.",
  "GOJAR, Miraquel R.",
  "IGNACIO, Danilo Miguel D.",
  "LACUARTA, Maebelle Joy G.",
  "MACULA, Krizza Mae F.",
  "MELANO, Arjay A.",
  "MONTERO, Emilyn F.",
  "NAKPIL, Kurt Aldrich B.",
  "OCAMPO, El Christian B.",
  "PASCO, Arbie Joy E.",
  "PAT, Neil L.",
  "POL, Jomar F.",
  "REY, Ralph Dexter P.",
  "RUGA, Kiesly P.",
  "SILANG, Joshwa A.",
  "SILLA, Roxane Jane M.",
  "SUMBAD, Dave B.",
  "VIRAYE, John Lloyd L.",
];

const STUDENTS_103 = [
  "ALVARICO, Kevin Willard R.",
  "ANTARAN, Joemel V.",
  "ANTONIO, Mark Vince O.",
  "BAGUNAS, Ellaiza F.",
  "BAYDAL, Brandon James D.",
  "BUMACOD, John Rey F.",
  "CHAVEZ, Jairus Myrtle F.",
  "COMIA, Jennylyn M.",
  "CONSUMO, Carol V.",
  "DE TORRES, Michael L.",
  "DELMO, Angel Boy P.",
  "DICHOSO, Angelyn Kaye G.",
  "DOMINGUEZ, Jeferson M.",
  "FAMINIAL, Keziah Nicole O.",
  "GERVACIO, Rhian D.",
  "JAMBALOS, Manuel James E.",
  "LOJO, Leereine R.",
  "MABUNGA, Jhondrei P.",
  "MORALES, John Patrick D.",
  "MORONG, Kian Andrew M.",
  "OCAMPO, Nicho D.",
  "OTALIA, Jezza May P.",
  "PADUA, Jenelyn M.",
  "REVILLOZA, Michaella Irene P.",
  "REY, Zandrex P.",
  "REYES, John David Aaron B.",
  "SALMORIN, Henrich Nyl F.",
];

const STUDENTS_104 = [
  "AGONCILLO, John Vincent R.",
  "CASAO, Kristine D.",
  "CASAPAO, Rey Mark D.",
  "CONSUMO , Jake S.",
  "DE GUZMAN, Norelyn A.",
  "DELOS REYES, Trisha Mae T.",
  "DIMACUHA, Princess R.",
  "DIMALIBOT, Spencer Jay R.",
  "FAMINIAL, Brylle Neil M.",
  "GAN, Elizabeth M.",
  "GUTIERREZ, Jerque Klein A.",
  "MADRIGAL, Andrian M.",
  "MILLARES, Mariel P.",
  "MONTERO, Kc Mae L.",
  "NARZOLES, Marsha Lorine A.",
  "ORNEDO, Juan Miguel S.",
  "PAJANIL, Regine Kyle A.",
  "PASTORAL, Rijee L.",
  "RAFOL, Hurley A.",
  "RESQUITA, John Ford M.",
  "SALAS, John Rico M.",
  "SAPUNGAN, Euval Angelo P.",
  "VALE, Ara Joy M.",
  "YLAGAN, Zach Ornest .",
];

const STUDENTS_201 = [
  "BAGSIT, Renz Zyruz B.",
  "BARAL, Oriel M.",
  "CASAPAO, Carla V.",
  "CASIANO, Kaezer James M.",
  "CASTILLO, Janna Mae M.",
  "CASTILLO, Pauleen Jane A.",
  "DALISAY, Karyle B.",
  "DEL MUNDO, Samantha Nicole .",
  "FALAME, Paul Vincent M.",
  "FLORES, Ladylyn B.",
  "GALLOS, Curt Vincent C.",
  "HERNANDEZ, Ranz Gian M.",
  "LIZA, Jovelle G.",
  "LLANES, Izzy R.",
  "MAGBUHOS, Shane Janry L.",
  "MAMING, Mae Ann R.",
  "MERES, Mary Jane C.",
  "MOLBOG, Brix Aikeen G.",
  "PADERES, Jake M.",
  "PANTOJA, Zeus Carl L.",
  "PEREZ, Paulo Ian O.",
  "PETALCO, Keisha Mae B.",
  "RIBON, Princess Angel A.",
  "SELOZA, Noriel .",
  "YAP, Jasmine M.",
];

const STUDENTS_202 = [
  "ACOSTA, John Renz A.",
  "BABAO, Jefferson A.",
  "CAPISPISAN, Eddison S.",
  "CLAUD, Semmier Rocky H.",
  "DELA CRUZ, Meca J.",
  "FEDELIN, Dandreb M.",
  "GREGORIO, Maezel P.",
  "INOCENCIO, Divine Grace R.",
  "LANETE, Micca B.",
  "LAZARO, Robilyn Kate S.",
  "LINCALLO, Aibe C.",
  "MABINI, Icie R.",
  "MABINI, Iza R.",
  "MAMENG, Teo R.",
  "MANATO, Shania Kim L.",
  "MENDOZA, Lhea C.",
  "MOTOL, Lance Harold V.",
  "MUSNIT, Princess M.",
  "MUTYA, Frencess Ealyn M.",
  "MUTYA, Jhun Alrich S.",
  "NIELO, Janecel G.",
  "PRIETO, Benz Lorenz M.",
  "RETANAL, Ian Kirby L.",
  "VALENCIA, Johny S.",
];

export default function AttendancePage({ sectionId, onBack }) {
  const [term, setTerm] = useState("midterm");

  const { termDates, updateTermDates, appConfig } = useSettings();

  const handleUpdateTermDates = (updateAction) => {
    // Determine new state based on whether updateAction is a function or value
    const newDates =
      typeof updateAction === "function"
        ? updateAction(termDates)
        : updateAction;
    updateTermDates(newDates);
  };

  const dates = useMemo(() => {
    if (term === "midterm") {
      return generateDates(
        new Date(termDates.midtermStart),
        new Date(termDates.midtermEnd),
      );
    } else {
      return generateDates(
        new Date(termDates.finalsStart),
        new Date(termDates.finalsEnd),
      );
    }
  }, [term, termDates]);

  const {
    students,
    attendance,
    customHolidays,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
    toggleAttendance,
    resetAttendance,
    batchAddStudents,
    addCustomHoliday,
    removeCustomHoliday,
    stats,
    totalSchoolDays,
    error,
  } = useAttendance(dates, sectionId);

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
  });

  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: "",
    defaultValue: "",
    onConfirm: () => {},
  });

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));
  const closeInputModal = () =>
    setInputModal((prev) => ({ ...prev, isOpen: false }));

  const handleResetRequest = () => {
    setModal({
      isOpen: true,
      title: "Reset Section Data?",
      message: `This will delete ALL attendance for Section ${sectionId}.`,
      isDestructive: true,
      onConfirm: () => {
        resetAttendance();
        closeModal();
      },
    });
  };

  const handleDeleteAllStudentsRequest = () => {
    setModal({
      isOpen: true,
      title: "Delete All Students?",
      message: `Are you sure you want to delete ALL ${students.length} students in Section ${sectionId}? This cannot be undone.`,
      isDestructive: true,
      onConfirm: () => {
        deleteAllStudents();
        closeModal();
      },
    });
  };

  const handleDeleteStudentRequest = (id) => {
    const student = students.find((s) => s.id === id);
    setModal({
      isOpen: true,
      title: "Delete Student?",
      message: `Remove ${student?.name}?`,
      isDestructive: true,
      onConfirm: () => {
        deleteStudent(id);
        closeModal();
      },
    });
  };

  const handleEditStudentRequest = (student) => {
    setInputModal({
      isOpen: true,
      title: "Edit Student Name",
      defaultValue: student.name,
      onConfirm: (newName) => {
        updateStudent(student.id, newName);
        closeInputModal();
      },
    });
  };

  const handleImport = () => {
    // Determine which list to import
    const listToImport =
      sectionId === "101"
        ? STUDENTS_101
        : sectionId === "102"
          ? STUDENTS_102
          : sectionId === "103"
            ? STUDENTS_103
            : sectionId === "104"
              ? STUDENTS_104
              : sectionId === "201"
                ? STUDENTS_201
                : sectionId === "202"
                  ? STUDENTS_202
                  : null;

    if (!listToImport) return;

    // Filter out students that are already in the list
    const existingNames = new Set(students.map((s) => s.name));
    const newStudents = listToImport.filter((name) => !existingNames.has(name));

    if (newStudents.length === 0) {
      // Optional: Show a message that all students are already added
      return;
    }

    setModal({
      isOpen: true,
      title: `Import ${sectionId} Student List?`,
      message: `This will add ${newStudents.length} missing students to this section.`,
      isDestructive: false,
      onConfirm: () => {
        batchAddStudents(newStudents);
        closeModal();
      },
    });
  };

  const handleExportRequest = () => {
    setIsExportModalOpen(true);
  };

  const executeExport = (headerInfo) => {
    exportToExcel({
      sectionId,
      term,
      dates,
      students,
      attendance,
      customHolidays,
      stats,
      totalSchoolDays,
      headerInfo,
    });
    setIsExportModalOpen(false);
  };

  // Determine standard list length safely
  const standardListLength = useMemo(() => {
    switch (sectionId) {
      case "101":
        return STUDENTS_101.length;
      case "102":
        return STUDENTS_102.length;
      case "103":
        return STUDENTS_103.length;
      case "104":
        return STUDENTS_104.length;
      case "201":
        return STUDENTS_201.length;
      case "202":
        return STUDENTS_202.length;
      default:
        return 0;
    }
  }, [sectionId]);

  const hasImportableList =
    !loading && standardListLength > 0 && students.length < standardListLength;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      <ExportConfigurationModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={executeExport}
        sectionId={sectionId}
        term={term}
        studentCount={students.length}
      />
      <ConfirmModal {...modal} onCancel={closeModal} />
      <InputModal
        isOpen={inputModal.isOpen}
        title={inputModal.title}
        defaultValue={inputModal.defaultValue}
        onConfirm={inputModal.onConfirm}
        onCancel={closeInputModal}
      />
      <HolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        customHolidays={customHolidays}
        addHoliday={addCustomHoliday}
        removeHoliday={removeCustomHoliday}
        termDates={termDates}
        onUpdateTermDates={handleUpdateTermDates}
        onDeleteAllStudents={handleDeleteAllStudentsRequest}
        hasStudents={students.length > 0}
      />

      <Header
        resetAttendance={handleResetRequest}
        schoolDaysCount={totalSchoolDays}
        currentTerm={term}
        setTerm={setTerm}
        appTitle={appConfig?.title}
      />

      {/* Sub Header for Section & Back */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-[68px] z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-700">Section {sectionId}</span>
        </div>

        {hasImportableList && (
          <button
            onClick={handleImport}
            className="flex items-center gap-2 ml-4 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 font-bold hover:bg-emerald-100 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            Load Class List
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportRequest}
            disabled={students.length === 0}
            className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100 font-bold hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={() => setIsHolidayModalOpen(true)}
            className="flex items-center gap-2 text-xs bg-white text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {error && error.code === "PERMISSION_DENIED" && (
        <div className="bg-red-100 text-red-800 p-2 text-center text-xs font-bold">
          Database Locked. Please enable rules in Firebase Console.
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="flex-1 overflow-hidden flex flex-col p-2 md:p-4 max-w-[1920px] mx-auto w-full">
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
            <AttendanceTable
              dates={dates}
              students={students}
              attendance={attendance}
              toggleAttendance={toggleAttendance}
              addStudent={addStudent}
              deleteStudent={handleDeleteStudentRequest}
              editStudent={handleEditStudentRequest}
              stats={stats}
              sectionId={sectionId}
              customHolidays={customHolidays}
              totalSchoolDays={totalSchoolDays}
              schedules={appConfig?.schedules}
            />
          </div>
        </main>
      )}
    </div>
  );
}
