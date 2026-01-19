import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format, isSaturday, isSunday, isDate } from "date-fns";
import { isDateHoliday } from "./holidays";
import { isNoClassDay } from "./schedule";
import { groupDatesByMonth, chunkDates } from "./dateUtils";

// Color Constants (ARGB)
const COLORS = {
  YELLOW_BG: "FFFFFF00", // Nov
  GREEN_BG: "FF90EE90", // Dec
  BLUE_BG: "FFADD8E6", // Jan/Feb
  PURPLE_BG: "FFE6E6FA", // Feb
  RED_TEXT: "FFFF0000",
  WHITE: "FFFFFFFF",
  SLATE_100: "FFF1F5F9", // Blocked
  RED_100: "FFFEE2E2", // Holiday
};

const MONTH_COLORS = {
  November: COLORS.YELLOW_BG,
  December: COLORS.GREEN_BG,
  January: COLORS.BLUE_BG,
  February: COLORS.BLUE_BG, // Using Blue for Feb based on image, or maybe different?
  March: COLORS.PURPLE_BG,
  April: COLORS.GREEN_BG,
};

// Helper: Apply Border to Cell
const applyBorder = (cell) => {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
};

export const exportToExcel = async ({
  sectionId,
  term,
  dates,
  students,
  attendance,
  customHolidays,
  stats,
  totalSchoolDays,
  headerInfo,
}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Section ${sectionId}`);

  // Page Setup - Legal (8.5 x 14) is standard 5. Folio (8.5x13) is often custom.
  // We use Legal and fit to page.
  worksheet.pageSetup = {
    paperSize: 5, // Legal
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.25,
      bottom: 0.25,
      header: 0.1,
      footer: 0.1,
    },
  };

  // 1. Data Processing
  // Filter out "No Class" days
  const validDates = dates.filter((d) => {
    const { isBlocked } = isNoClassDay(d, sectionId);
    return !isBlocked;
  });

  const monthGroups = groupDatesByMonth(validDates);
  const monthKeys = Object.keys(monthGroups);

  const COL_OFFSET = 3;
  let currentPairCol = COL_OFFSET;
  const pairColumns = [];

  monthKeys.forEach((month) => {
    const mDates = monthGroups[month];
    const chunks = chunkDates(mDates, 2);
    chunks.forEach((chunk) => {
      pairColumns.push({
        month,
        pair: chunk,
        colIndex: currentPairCol,
        isEmpty: false,
      });
      currentPairCol++;
    });
  });

  // Ensure minimum columns to fill the page (Visual match)
  const MIN_DATA_COLS = 25; // Target width
  const usedCols = pairColumns.length;
  if (usedCols < MIN_DATA_COLS) {
    const needed = MIN_DATA_COLS - usedCols;
    for (let i = 0; i < needed; i++) {
      pairColumns.push({
        month: "", // Empty month header
        pair: [null, null],
        colIndex: currentPairCol,
        isEmpty: true,
      });
      currentPairCol++;
    }
  }

  const TOTAL_COLS = currentPairCol; // Last col index is this (Stats col)

  // 2. Setup Columns Widths
  worksheet.getColumn(1).width = 4; // NO
  worksheet.getColumn(2).width = 35; // NAME
  for (let i = 3; i < TOTAL_COLS; i++) {
    worksheet.getColumn(i).width = 4; // Date Cols
  }
  worksheet.getColumn(TOTAL_COLS).width = 8; // TOTAL

  // 3. HEADER SECTION (Top Rows)

  // -- Row 1-3: Institution Info --
  // Row 1: Form Name (Left) & College Name (Right part)
  worksheet.mergeCells(1, 1, 1, 2);
  const cellForm = worksheet.getCell(1, 1);
  cellForm.value = "FORM-R01 - OFFICIAL\nCLASS RECORD";
  cellForm.font = { size: 6, name: "Arial", bold: true };
  cellForm.alignment = {
    vertical: "top",
    horizontal: "left",
    wrapText: true,
  };

  // College Name (Merge remaining cols)
  worksheet.mergeCells(1, 3, 1, TOTAL_COLS);
  const cellCollege = worksheet.getCell(1, 3);
  cellCollege.value = "INNOVATIVE COLLEGE OF SCIENCE & TECHNOLOGY";
  cellCollege.font = { size: 10, name: "Times New Roman", bold: true };
  cellCollege.alignment = { horizontal: "center", vertical: "bottom" };

  // Row 2: Address (Center across FULL Page)
  worksheet.mergeCells(2, 1, 2, TOTAL_COLS);
  const cellAddr = worksheet.getCell(2, 1);
  cellAddr.value = "Malitbog, Bongabong, Oriental Mindoro, Philippines";
  cellAddr.font = { size: 8, name: "Times New Roman" };
  cellAddr.alignment = { horizontal: "center", vertical: "top" };

  // Row 3: Tel No (Center across FULL Page)
  worksheet.mergeCells(3, 1, 3, TOTAL_COLS);
  const cellTel = worksheet.getCell(3, 1);
  cellTel.value = "Tel No. (043)283-5524/ 283-5561";
  cellTel.font = { size: 8, name: "Times New Roman" };
  cellTel.alignment = { horizontal: "center", vertical: "top" };

  // Separator Line 1
  for (let c = 1; c <= TOTAL_COLS; c++) {
    worksheet.getCell(3, c).border = { bottom: { style: "double" } };
  }

  // -- Row 4: Registrar & Code --
  const r4 = worksheet.getRow(4);
  r4.height = 24;

  // Registrar Title (Center across FULL Page, avoiding AR code if possible?
  // Use 1 to Total-3 for Center balance, and Total-2 to Total for AR)
  const arStart = TOTAL_COLS - 2;
  worksheet.mergeCells(4, 1, 4, arStart - 1); // Main Title
  const cellReg = worksheet.getCell(4, 1);
  cellReg.value = "OFFICE OF THE REGISTRAR";
  cellReg.font = { size: 12, name: "Arial Black", bold: true };
  cellReg.alignment = { horizontal: "center", vertical: "middle" };

  // AR341 Code (Right)
  worksheet.mergeCells(4, arStart, 4, TOTAL_COLS);
  const cellAr = worksheet.getCell(4, arStart);
  cellAr.value = headerInfo?.registrarCode || "AR341";
  cellAr.font = { size: 11, name: "Arial", bold: true };
  cellAr.alignment = { horizontal: "right", vertical: "middle" };

  // Separator Line 2
  for (let c = 1; c <= TOTAL_COLS; c++) {
    worksheet.getCell(4, c).border = { bottom: { style: "thin" } };
  }

  // -- ROWS 5-7: Meta Data --
  // Calculate specific zones
  const q1 = Math.floor(TOTAL_COLS * 0.25);
  const mid = Math.floor(TOTAL_COLS * 0.5);
  const q3 = Math.floor(TOTAL_COLS * 0.75);

  const r5 = worksheet.getRow(5);
  r5.height = 18;

  // Row 5: Instructor (Left Half) | Subject (Right Half)
  worksheet.mergeCells(5, 1, 5, mid);
  const cellInstr = worksheet.getCell(5, 1);
  cellInstr.value = {
    richText: [
      { text: "Name of Instructor :   ", font: { size: 9, name: "Arial" } },
      {
        text: (headerInfo?.instructor || "").toUpperCase(),
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellInstr.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells(5, mid + 1, 5, TOTAL_COLS);
  const cellSubj = worksheet.getCell(5, mid + 1);
  cellSubj.value = {
    richText: [
      { text: "Subject Handled :   ", font: { size: 9, name: "Arial" } },
      {
        text: headerInfo?.subject || "",
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellSubj.alignment = { vertical: "middle", horizontal: "left" }; // Left aligned start at Mid

  // Row 6: Day | Time | Room | Count
  const r6 = worksheet.getRow(6);
  r6.height = 18;

  // Zone 1: Day (1 -> Q1)
  worksheet.mergeCells(6, 1, 6, q1);
  const cellDay = worksheet.getCell(6, 1);
  cellDay.value = {
    richText: [
      { text: "Day/s : ", font: { size: 9, name: "Arial" } },
      {
        text: headerInfo?.days || "",
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellDay.alignment = { vertical: "middle", horizontal: "left" };

  // Zone 2: Time (Q1+1 -> Mid)
  worksheet.mergeCells(6, q1 + 1, 6, mid);
  const cellTime = worksheet.getCell(6, q1 + 1);
  cellTime.value = {
    richText: [
      { text: "Time : ", font: { size: 9, name: "Arial" } },
      {
        text: headerInfo?.time || "",
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellTime.alignment = { vertical: "middle", horizontal: "center" }; // Center within zone

  // Zone 3: Room (Mid+1 -> Q3)
  worksheet.mergeCells(6, mid + 1, 6, q3);
  const cellRoom = worksheet.getCell(6, mid + 1);
  cellRoom.value = {
    richText: [
      { text: "Room : ", font: { size: 9, name: "Arial" } },
      {
        text: headerInfo?.room || "",
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellRoom.alignment = { vertical: "middle", horizontal: "center" };

  // Zone 4: Count (Q3+1 -> End)
  worksheet.mergeCells(6, q3 + 1, 6, TOTAL_COLS);
  const cellCount = worksheet.getCell(6, q3 + 1);
  // Just number? Label?
  cellCount.value = {
    richText: [
      {
        text: "No. of Students Enrolled :  ",
        font: { size: 9, name: "Arial" },
      },
      {
        text: `${students.length}`,
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellCount.alignment = { vertical: "middle", horizontal: "right" };

  // Row 7: Acad | Sem | Course
  const r7 = worksheet.getRow(7);
  r7.height = 18;

  // Zone 1: Acad (1 -> Q1 approx or larger)
  // Give Acad a bit more space, Sem a bit less?
  // Let's use thirds? Or match the mid split?
  // Image: Acad (Left), Sem (Center), Course (Right).
  // Let's use 1->Q1+2, ...

  // Acad (1 -> Mid) - Matches Instructor block logic roughly
  worksheet.mergeCells(7, 1, 7, q1 + 2);
  const cellAcad = worksheet.getCell(7, 1);
  cellAcad.value = {
    richText: [
      { text: "Academic Year :  ", font: { size: 9, name: "Arial" } },
      {
        text: headerInfo?.academicYear || "",
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellAcad.alignment = { vertical: "middle", horizontal: "left" };

  // Sem (Mid-ish zone)
  worksheet.mergeCells(7, q1 + 3, 7, q3 + 2);
  const cellSem = worksheet.getCell(7, q1 + 3);
  cellSem.value = {
    richText: [
      { text: "Semester :  ", font: { size: 9, name: "Arial" } },
      {
        text: headerInfo?.semester || "",
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellSem.alignment = { vertical: "middle", horizontal: "center" };

  // Course (Right)
  worksheet.mergeCells(7, q3 + 3, 7, TOTAL_COLS);
  const cellCourse = worksheet.getCell(7, q3 + 3);
  cellCourse.value = {
    richText: [
      { text: "Course :  ", font: { size: 9, name: "Arial" } },
      {
        text: (headerInfo?.course || sectionId).toUpperCase(),
        font: { size: 9, name: "Arial", bold: true },
      },
    ],
  };
  cellCourse.alignment = { vertical: "middle", horizontal: "right" };

  // --- 4. TABLE GENERATION ---
  const TABLE_START = 8;
  const HEADER_FILL = "FFD9D9D9"; // Light Gray

  // Row 8: "ATTENDANCE" (Col 3 -> End)
  // Row 8: "Name" (Col 1-2 merged down to Row 10)
  worksheet.mergeCells(TABLE_START, 1, TABLE_START + 2, 2); // Name block
  const cellNameHeader = worksheet.getCell(TABLE_START, 1);
  cellNameHeader.value = "Name";
  cellNameHeader.font = { bold: true, size: 11, name: "Arial" };
  cellNameHeader.alignment = { horizontal: "center", vertical: "middle" };
  cellNameHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  applyBorder(cellNameHeader);

  // Main Attendance Header
  worksheet.mergeCells(TABLE_START, 3, TABLE_START, TOTAL_COLS);
  const cellAttMain = worksheet.getCell(TABLE_START, 3);
  cellAttMain.value = "ATTENDANCE";
  cellAttMain.font = { bold: true, size: 10, name: "Arial" };
  cellAttMain.alignment = { horizontal: "center", vertical: "middle" };
  cellAttMain.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  applyBorder(cellAttMain);

  // Sub Header (Row 9) - Term (Midterm/Final) -> We use what we have
  worksheet.mergeCells(TABLE_START + 1, 3, TABLE_START + 1, TOTAL_COLS);
  const cellTerm = worksheet.getCell(TABLE_START + 1, 3);
  cellTerm.value = (term === "midterm" ? "MIDTERM" : "FINAL").toUpperCase();
  cellTerm.font = { bold: true, size: 9, name: "Arial" };
  cellTerm.alignment = { horizontal: "center", vertical: "middle" };
  cellTerm.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  applyBorder(cellTerm);

  // Month Headers (Row 10)
  let mStart = 3;
  let currM = pairColumns[0]?.month || "";

  for (let i = 0; i < pairColumns.length; i++) {
    const p = pairColumns[i];
    const isLast = i === pairColumns.length - 1;

    if (p.isEmpty) {
      // Handle empty column border if needed
      const mCell = worksheet.getCell(TABLE_START + 2, p.colIndex);
      mCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HEADER_FILL },
      };
      applyBorder(mCell);
    }

    if (p.month !== currM || isLast) {
      // If we are switching, we merge the previous block
      // Determine end column of the block
      let mEnd;
      if (isLast && p.month === currM) {
        mEnd = p.colIndex;
      } else {
        mEnd = p.colIndex - 1;
      }

      // Check if mStart is valid and mEnd >= mStart
      if (mStart <= mEnd && currM) {
        worksheet.mergeCells(TABLE_START + 2, mStart, TABLE_START + 2, mEnd);
        const mCell = worksheet.getCell(TABLE_START + 2, mStart);
        mCell.value = currM.toUpperCase();
        mCell.font = { bold: true, size: 8 };
        mCell.alignment = { horizontal: "center", vertical: "middle" };
        mCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_FILL },
        };
        applyBorder(mCell);
      } else if (isLast && p.month !== currM && p.month) {
        // Edge case: Last column is a new month
        const mCell = worksheet.getCell(TABLE_START + 2, p.colIndex);
        mCell.value = p.month.toUpperCase();
        mCell.font = { bold: true, size: 8 };
        mCell.alignment = { horizontal: "center", vertical: "middle" };
        mCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_FILL },
        };
        applyBorder(mCell);
      }

      currM = p.month;
      mStart = p.colIndex;
    }
  }

  // Row 10 Last Col: "AT"
  worksheet.mergeCells(
    TABLE_START + 2,
    TOTAL_COLS,
    TABLE_START + 2,
    TOTAL_COLS,
  );
  const atHead = worksheet.getCell(TABLE_START + 2, TOTAL_COLS);
  atHead.value = "AT";
  atHead.font = { bold: true, size: 8 };
  atHead.alignment = { horizontal: "center", vertical: "middle" };
  applyBorder(atHead);

  // DATA ROWS Loop
  let currentRow = TABLE_START + 5;

  students.forEach((student, index) => {
    // 2 Rows per student
    // NO
    worksheet.mergeCells(currentRow, 1, currentRow + 1, 1);
    const cellNo = worksheet.getCell(currentRow, 1);
    cellNo.value = index + 1;
    cellNo.alignment = { horizontal: "center", vertical: "middle" };
    cellNo.font = { size: 9 };
    applyBorder(cellNo);

    // NAME
    worksheet.mergeCells(currentRow, 2, currentRow + 1, 2);
    const cellName = worksheet.getCell(currentRow, 2);
    cellName.value = student.name.toUpperCase();
    cellName.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    cellName.font = { size: 9 };
    applyBorder(cellName);

    // Attendance Cells
    let studentPresentTotal = 0;

    pairColumns.forEach((colData) => {
      const colIdx = colData.colIndex;

      if (colData.isEmpty) {
        const c1 = worksheet.getCell(currentRow, colIdx);
        applyBorder(c1);
        const c2 = worksheet.getCell(currentRow + 1, colIdx);
        applyBorder(c2);
        return;
      }

      const d1 = colData.pair[0];
      const d2 = colData.pair[1];

      // Top Cell
      const cell1 = worksheet.getCell(currentRow, colIdx);
      applyBorder(cell1);

      const { isBlocked: blocked1 } = isNoClassDay(d1, sectionId);
      const hol1 = isDateHoliday(d1, customHolidays).isHoliday;
      const wknd1 = isSunday(d1) || isSaturday(d1);

      if (!blocked1 && !hol1 && !wknd1) {
        const key1 = format(d1, "yyyy-MM-dd");
        if (attendance[key1]?.[student.id]) {
          cell1.value = "/";
          cell1.alignment = { horizontal: "center", vertical: "middle" };
        } else {
          studentPresentTotal++;
        }
      } else {
        cell1.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F0F0" },
        };
      }

      // Bottom Cell
      const cell2 = worksheet.getCell(currentRow + 1, colIdx);
      applyBorder(cell2);
      if (d2) {
        const { isBlocked: blocked2 } = isNoClassDay(d2, sectionId);
        const hol2 = isDateHoliday(d2, customHolidays).isHoliday;
        const wknd2 = isSunday(d2) || isSaturday(d2);

        if (!blocked2 && !hol2 && !wknd2) {
          const key2 = format(d2, "yyyy-MM-dd");
          if (attendance[key2]?.[student.id]) {
            cell2.value = "/";
            cell2.alignment = { horizontal: "center", vertical: "middle" };
          } else {
            studentPresentTotal++;
          }
        } else {
          cell2.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F0F0" },
          };
        }
      } else {
        cell2.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F0F0" },
        };
      }
    });

    // Total
    worksheet.mergeCells(currentRow, TOTAL_COLS, currentRow + 1, TOTAL_COLS);
    const cellTotal = worksheet.getCell(currentRow, TOTAL_COLS);
    cellTotal.value = studentPresentTotal;
    cellTotal.alignment = { horizontal: "center", vertical: "middle" };
    cellTotal.font = { bold: true };
    applyBorder(cellTotal);

    currentRow += 2;
  });

  // DATE HEADERS (Row 11/12) - Inserted Here
  pairColumns.forEach((colData) => {
    const colIdx = colData.colIndex;

    if (colData.isEmpty) {
      const c1 = worksheet.getCell(TABLE_START + 3, colIdx);
      applyBorder(c1);
      const c2 = worksheet.getCell(TABLE_START + 4, colIdx);
      applyBorder(c2);
      return;
    }

    const d1 = colData.pair[0];
    const d2 = colData.pair[1];

    // Top Date Header
    const c1 = worksheet.getCell(TABLE_START + 3, colIdx);
    c1.value = {
      richText: [
        { text: format(d1, "d") + "\n", font: { size: 9 } },
        {
          text: format(d1, "EEEEE"),
          font: { size: 7, bold: true, color: { argb: "FF555555" } },
        },
      ],
    };
    c1.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    applyBorder(c1);

    // Bottom Date Header
    const c2 = worksheet.getCell(TABLE_START + 4, colIdx);
    if (d2) {
      c2.value = {
        richText: [
          { text: format(d2, "d") + "\n", font: { size: 9 } },
          {
            text: format(d2, "EEEEE"),
            font: { size: 7, bold: true, color: { argb: "FF555555" } },
          },
        ],
      };
    } else {
      c2.value = "";
    }
    c2.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    applyBorder(c2);
  });

  // Footer
  currentRow += 2;
  worksheet.mergeCells(currentRow, 1, currentRow, TOTAL_COLS);
  const cert = worksheet.getCell(currentRow, 1);
  cert.value = "CERTIFIED CORRECT :";
  cert.font = { bold: true, size: 9, name: "Arial" };
  cert.alignment = { horizontal: "right", vertical: "middle" };

  currentRow += 2;
  // Signature Line
  const sigStartCol = TOTAL_COLS - 6; // approximate
  worksheet.mergeCells(currentRow, sigStartCol, currentRow, TOTAL_COLS);
  const sigLine = worksheet.getCell(currentRow, sigStartCol);
  sigLine.border = { bottom: { style: "thin" } };

  currentRow += 1;
  worksheet.mergeCells(currentRow, sigStartCol, currentRow, TOTAL_COLS);
  const sigName = worksheet.getCell(currentRow, sigStartCol);
  sigName.value = "Signature over Printed Name";
  sigName.font = { italic: true, size: 9, name: "Arial" };
  sigName.alignment = { horizontal: "center", vertical: "top" };

  // 5. Generate
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(
    blob,
    `Attendance_${headerInfo?.course || sectionId}_${term}_${format(new Date(), "yyyyMMdd")}.xlsx`,
  );
};
