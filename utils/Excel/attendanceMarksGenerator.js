const ExcelJS = require("exceljs");

async function generateAttendanceMarksExcel(res, course, enrollments) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Marks");

  // ===== MERGE & SET VALUE HELPER =====
  function mergeSet(row, col, endCol, value, fontOpts = {}, align = "center") {
    worksheet.mergeCells(`${col}${row}:${endCol}${row}`);
    const cell = worksheet.getCell(`${col}${row}`);
    cell.value = value;
    cell.font = { bold: true, size: 14, ...fontOpts };
    cell.alignment = { horizontal: align, vertical: "middle" };
  }

  // ===== HEADER =====
  // Row 1: Course Name
  mergeSet(1, "A", "H", `${course.courseNumber}th ${course.courseName}`, {
    size: 16,
  });
  worksheet.getRow(1).height = 30;

  // Row 2: Course Dates
  mergeSet(
    2,
    "A",
    "H",
    `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
    { size: 12, bold: false },
  );
  worksheet.getRow(2).height = 25;

  // Row 3: SDC Name
  mergeSet(3, "A", "H", "SKILL DEVELOPMENT CENTRE, CFEES", { size: 14 });
  worksheet.getRow(3).height = 28;

  // Row 4: DRDO
  mergeSet(4, "A", "H", "DRDO, MINISTRY OF DEFENCE", { size: 11, bold: false });
  worksheet.getRow(4).height = 22;

  // Row 5: Address Line 1
  mergeSet(5, "A", "H", "PILKHUWA, HAPUR (U.P.)", { size: 11, bold: false });
  worksheet.getRow(5).height = 22;

  // Row 6: PIN
  mergeSet(6, "A", "H", "PIN - 245304", { size: 11, bold: false });
  worksheet.getRow(6).height = 22;

  // Row 7: Blank
  worksheet.getRow(7).height = 10;

  // ===== TITLE =====
  mergeSet(8, "A", "H", "ATTENDANCE MARKS", {
    size: 16,
    bold: true,
    underline: true,
  });
  worksheet.getRow(8).height = 30;

  // Row 9: Blank
  worksheet.getRow(9).height = 10;

  // ===== MARKS CRITERIA (Single Row) =====
  mergeSet(
    10,
    "A",
    "H",
    "Max Marks: 10/10    |    Min Passing: 06/10    |    Per Leave Cut: 0.5 marks",
    { size: 11, bold: false },
  );
  worksheet.getRow(10).height = 25;

  // Row 11: Blank
  worksheet.getRow(11).height = 10;

  // ===== TABLE HEADERS =====
  const headers = [
    "S. No.",
    "Personnel No.",
    "Rank",
    "Name",
    "Leaves Taken (Dates)",
    "Total Leaves",
    "Total Marks",
    "Sign",
  ];

  const headerRow = worksheet.getRow(12);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
  });
  worksheet.getRow(12).height = 35;

  // ===== TABLE DATA =====
  enrollments.forEach((enrollment, index) => {
    const leaves = enrollment.leaves || [];
    const leaveDates =
      leaves.length > 0
        ? (() => {
            const dates = leaves.map((l) =>
              new Date(l).toLocaleDateString("en-IN"),
            );
            if (dates.length === 1) {
              return dates[0];
            }
            if (dates.length === 2) {
              return `${dates[0]} and ${dates[1]}`;
            }
            return `${dates.slice(0, -1).join(", ")} and ${dates[dates.length - 1]}`;
          })()
        : "No leave taken";
    const totalLeaves = leaves.length;
    const totalMarks =
      enrollment.totalMarks !== undefined ? enrollment.totalMarks : 10;

    const row = worksheet.addRow([
      index + 1,
      enrollment.applicantId?.personnelNumber || "",
      enrollment.applicantId?.rank || "",
      enrollment.applicantId?.name || "",
      leaveDates,
      totalLeaves,
      totalMarks.toFixed(1),
      "",
    ]);

    row.eachCell((cell) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.font = { size: 9 };
    });

    row.height = 25;
  });

  // ===== COLUMN WIDTHS =====
  worksheet.getColumn(1).width = 8; // S. No.
  worksheet.getColumn(2).width = 16; // Personnel No.
  worksheet.getColumn(3).width = 14; // Rank
  worksheet.getColumn(4).width = 22; // Name
  worksheet.getColumn(5).width = 35; // Leaves Taken (Dates)
  worksheet.getColumn(6).width = 14; // Total Leaves
  worksheet.getColumn(7).width = 14; // Total Marks
  worksheet.getColumn(8).width = 14; // Sign

  // ===== FREEZE PANE =====
  worksheet.views = [{ state: "frozen", ySplit: 12 }];

  // ===== RESPONSE =====
  const fileName = `AttendanceMarks - ${course.courseNumber}th ${course.courseName}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = generateAttendanceMarksExcel;
