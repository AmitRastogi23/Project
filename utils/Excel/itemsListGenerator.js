const ExcelJS = require("exceljs");

async function generateItemsListExcel(res, course, enrollments) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Items List");

  // Title
  worksheet.mergeCells("A1:H1");
  worksheet.getCell("A1").value =
    `${course.courseNumber}th ${course.courseName}`;
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.mergeCells("A2:H2");
  worksheet.getCell("A2").value =
    `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`;
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.mergeCells("A3:H3");
  worksheet.getCell("A3").value = "SKILL DEVELOPMENT CENTRE, CFEES";
  worksheet.getCell("A3").font = { bold: true, size: 14 };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.mergeCells("A4:H4");
  worksheet.getCell("A4").value = "DRDO, MINISTRY OF DEFENCE";
  worksheet.getCell("A4").alignment = { horizontal: "center" };

  worksheet.mergeCells("A5:H5");
  worksheet.getCell("A5").value = "PILKHUWA, HAPUR (U.P.)";
  worksheet.getCell("A5").alignment = { horizontal: "center" };

  worksheet.mergeCells("A6:H6");
  worksheet.getCell("A6").value = "PIN - 245304";
  worksheet.getCell("A6").alignment = { horizontal: "center" };

  worksheet.mergeCells("A8:H8");
  worksheet.getCell("A8").value = "ITEMS RECEIPT";
  worksheet.getCell("A8").font = { bold: true, size: 14 };
  worksheet.getCell("A8").alignment = { horizontal: "center" };

  // Headers
  const headers = [
    "S. No.",
    "Personnel No.",
    "Rank",
    "Name",
    "Course Kit",
    "Study Material",
    "Photograph",
    "Sign",
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
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 15;
  worksheet.getColumn(7).width = 15;
  worksheet.getColumn(8).width = 15;

  // Data
  enrollments.forEach((enrollment, index) => {
    const row = worksheet.addRow([
      index + 1,
      enrollment.applicantId?.personnelNumber || "",
      enrollment.applicantId?.rank || "",
      enrollment.applicantId?.name || "",
      enrollment.itemsReceived?.courseKit ? "✓" : "",
      enrollment.itemsReceived?.studyMaterial ? "✓" : "",
      enrollment.itemsReceived?.photograph ? "✓" : "",
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
    });
  });

  worksheet.views = [{ state: "frozen", ySplit: 10 }];

  const fileName = `ItemsList - ${course.courseNumber}th ${course.courseName}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = generateItemsListExcel;
