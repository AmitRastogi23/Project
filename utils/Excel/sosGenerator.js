const ExcelJS = require("exceljs");

async function generateSOSExcel(res, course, enrollments) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("SOS Report");

  // ===== HELPER =====
  function mergeSet(row, col, endCol, value, fontOpts = {}, align = "center") {
    worksheet.mergeCells(`${col}${row}:${endCol}${row}`);
    const cell = worksheet.getCell(`${col}${row}`);
    cell.value = value;
    cell.font = { bold: true, size: 14, ...fontOpts };
    cell.alignment = { horizontal: align, vertical: "middle" };
  }

  // ===== HEADER =====
  mergeSet(1, "A", "G", `${course.courseNumber}th ${course.courseName}`, {
    size: 16,
  });
  worksheet.getRow(1).height = 30;

  mergeSet(
    2,
    "A",
    "G",
    `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
    { size: 12, bold: false },
  );
  worksheet.getRow(2).height = 25;

  mergeSet(3, "A", "G", "SKILL DEVELOPMENT CENTRE, CFEES", { size: 14 });
  worksheet.getRow(3).height = 28;

  mergeSet(4, "A", "G", "DRDO, MINISTRY OF DEFENCE", { size: 11, bold: false });
  worksheet.getRow(4).height = 22;

  mergeSet(5, "A", "G", "PILKHUWA, HAPUR (U.P.)", { size: 11, bold: false });
  worksheet.getRow(5).height = 22;

  mergeSet(6, "A", "G", "PIN - 245304", { size: 11, bold: false });
  worksheet.getRow(6).height = 22;

  worksheet.getRow(7).height = 10;

  // ===== TITLE =====
  mergeSet(8, "A", "G", "STUCK OF SERVICE (SOS) REPORT", {
    size: 16,
    bold: true,
    underline: true,
  });
  worksheet.getRow(8).height = 30;

  worksheet.getRow(9).height = 10;

  // ===== TABLE HEADERS (Updated with SOS Reason, removed Sign) =====
  const headers = [
    "S. No.",
    "Personnel No.",
    "Rank",
    "Name",
    "SOS Date",
    "SOS Reason", // New column
  ];

  const headerRow = worksheet.getRow(10);
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
  worksheet.getRow(10).height = 30;

  // ===== TABLE DATA =====
  enrollments.forEach((enrollment, index) => {
    const sosDate = enrollment.SOS
      ? new Date(enrollment.SOS).toLocaleDateString("en-IN")
      : "--------";

    const sosReason = enrollment.SOSReason || "--------";

    const row = worksheet.addRow([
      index + 1,
      enrollment.applicantId?.personnelNumber || "",
      enrollment.applicantId?.rank || "",
      enrollment.applicantId?.name || "",
      sosDate,
      sosReason, // SOS Reason data
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

    row.height = 22;
  });

  // ===== COLUMN WIDTHS (Updated for new column) =====
  worksheet.getColumn(1).width = 8; // S. No.
  worksheet.getColumn(2).width = 18; // Personnel No.
  worksheet.getColumn(3).width = 14; // Rank
  worksheet.getColumn(4).width = 30; // Name (sabse lamba)
  worksheet.getColumn(5).width = 16; // SOS Date
  worksheet.getColumn(6).width = 35; // SOS Reason (thoda lamba)

  // ===== FREEZE PANE =====
  worksheet.views = [{ state: "frozen", ySplit: 10 }];

  // ===== RESPONSE =====
  const fileName = `SOSReport - ${course.courseNumber}th ${course.courseName}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = generateSOSExcel;
