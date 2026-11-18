const ExcelJS = require("exceljs");

async function generateClearanceExcel(res, course, applicants) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Clearance List");

  // Title
  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value =
    `${course.courseNumber}th ${course.courseName}`;
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value =
    `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`;
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A3:F3");
  worksheet.getCell("A3").value = "SKILL DEVELOPMENT CENTRE, CFEES";
  worksheet.getCell("A3").font = { bold: true, size: 14 };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.mergeCells("A4:F4");
  worksheet.getCell("A4").value = "DRDO, MINISTRY OF DEFENCE";
  worksheet.getCell("A4").alignment = { horizontal: "center" };

  worksheet.mergeCells("A5:F5");
  worksheet.getCell("A5").value = "PILKHUWA, HAPUR (U.P.)";
  worksheet.getCell("A5").alignment = { horizontal: "center" };

  worksheet.mergeCells("A6:F6");
  worksheet.getCell("A6").value = "PIN - 245304";
  worksheet.getCell("A6").alignment = { horizontal: "center" };

  worksheet.mergeCells("A8:F8");
  worksheet.getCell("A8").value = "CLEARANCE CERTIFICATE: NO DUES";
  worksheet.getCell("A8").font = { bold: true, size: 14 };
  worksheet.getCell("A8").alignment = { horizontal: "center" };

  // Headers
  const headers = [
    "S. No.",
    "Personnel No.",
    "Rank",
    "Name",
    "Department",
    "Signature",
  ];

  const headerRow = worksheet.getRow(10);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true };
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
  });

  // Column widths
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 18;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 30;
  worksheet.getColumn(5).width = 25;
  worksheet.getColumn(6).width = 20;

  // Data
  let serial = 1;
  let currentDepartment = "";

  for (const applicant of applicants) {
    const department = applicant.applicantId?.department || "";

    if (department !== currentDepartment) {
      currentDepartment = department;
      const deptRow = worksheet.addRow([]);
      const rowNumber = deptRow.number;
      worksheet.mergeCells(`A${rowNumber}:F${rowNumber}`);
      const deptCell = worksheet.getCell(`A${rowNumber}`);
      deptCell.value = department.toUpperCase();
      deptCell.font = { bold: true };
      deptCell.alignment = { horizontal: "center", vertical: "middle" };
      deptCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }

    const row = worksheet.addRow([
      serial++,
      applicant.applicantId?.personnelNumber || "",
      applicant.applicantId?.rank || "",
      applicant.applicantId?.name || "",
      applicant.applicantId?.department || "",
      "",
    ]);

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  worksheet.views = [{ state: "frozen", ySplit: 10 }];

  const fileName = `ClearanceList - ${course.courseNumber}th ${course.courseName}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = generateClearanceExcel;
