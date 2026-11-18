const ExcelJS = require("exceljs");

async function generateNominalRollExcel(res, course, applicants) {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet("Nominal Roll");

  worksheet.mergeCells("A1:K1");

  worksheet.getCell("A1").value =
    `${course.courseNumber}th ${course.courseName}`;

  worksheet.getCell("A1").font = {
    bold: true,
    size: 16,
  };

  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.mergeCells("A2:K2");

  worksheet.getCell("A2").value = `(${new Date(
    course.startDate,
  ).toLocaleDateString("en-GB")} to ${new Date(
    course.endDate,
  ).toLocaleDateString("en-GB")})`;

  worksheet.getCell("A2").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A3:K3");

  worksheet.getCell("A3").value = "SKILL DEVELOPMENT CENTRE, CFEES";

  worksheet.getCell("A3").font = {
    bold: true,
    size: 14,
  };

  worksheet.getCell("A3").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A4:K4");

  worksheet.getCell("A4").value = "DRDO, MINISTRY OF DEFENCE";

  worksheet.getCell("A4").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A5:K5");

  worksheet.getCell("A5").value = "PILKHUWA, HAPUR (U.P.)";

  worksheet.getCell("A5").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A6:K6");

  worksheet.getCell("A6").value = "PIN - 245304";

  worksheet.getCell("A6").alignment = {
    horizontal: "center",
  };

  worksheet.mergeCells("A8:K8");

  worksheet.getCell("A8").value = "NOMINAL ROLL";

  worksheet.getCell("A8").font = {
    bold: true,
    size: 14,
  };

  worksheet.getCell("A8").alignment = {
    horizontal: "center",
  };

  const headers = [
    "Roll No.",
    "Personnel No.",
    "Rank",
    "Name",
    "Unit Address",
    "Reporting Date",
    "FN / AN",
    "Mobile No.",
    "MO No.",
    "MO Date",
    "Sign",
  ];

  const headerRow = worksheet.getRow(10);

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);

    cell.value = header;

    cell.font = {
      bold: true,
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    cell.border = {
      top: {
        style: "thin",
      },
      left: {
        style: "thin",
      },
      bottom: {
        style: "thin",
      },
      right: {
        style: "thin",
      },
    };
  });

  const columnWidths = [
    10, // Roll No.
    18, // Personnel No.
    15, // Rank
    25, // Name
    35, // Unit Address
    18, // Reporting Date
    12, // FN / AN
    18, // Mobile No.
    15, // MO No.
    18, // MO Date
    12, // Sign
  ];

  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  let serial = 1;
  let currentDepartment = "";

  for (const applicant of applicants) {
    const department = applicant.applicantId?.department || "";

    if (department !== currentDepartment) {
      currentDepartment = department;

      const departmentRow = worksheet.addRow([]);

      const rowNumber = departmentRow.number;

      worksheet.mergeCells(`A${rowNumber}:K${rowNumber}`);

      const departmentCell = worksheet.getCell(`A${rowNumber}`);

      departmentCell.value = department.toUpperCase();

      departmentCell.font = {
        bold: true,
      };

      departmentCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      departmentCell.border = {
        top: {
          style: "thin",
        },
        left: {
          style: "thin",
        },
        bottom: {
          style: "thin",
        },
        right: {
          style: "thin",
        },
      };
    }

    let noonTime = "";

    if (applicant.noonTime === "ForeNoon") {
      noonTime = "FN";
    } else if (applicant.noonTime === "AfterNoon") {
      noonTime = "AN";
    } else {
      noonTime = applicant.noonTime || "";
    }

    const row = worksheet.addRow([
      serial++,

      applicant.applicantId?.personnelNumber || "",

      applicant.applicantId?.rank || "",

      applicant.applicantId?.name || "",

      applicant.applicantId?.unitAddress || "",

      applicant.reportingDate
        ? new Date(applicant.reportingDate).toLocaleDateString("en-IN")
        : "",

      noonTime,

      applicant.applicantId?.contact || "",

      applicant.MONumber || "",

      applicant.MODate
        ? new Date(applicant.MODate).toLocaleDateString("en-IN")
        : "",

      "",
    ]);

    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };

      cell.border = {
        top: {
          style: "thin",
        },
        left: {
          style: "thin",
        },
        bottom: {
          style: "thin",
        },
        right: {
          style: "thin",
        },
      };
    });

    row.getCell(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(2).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(3).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(6).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(7).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(8).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(9).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(10).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    row.getCell(11).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  }

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 10,
    },
  ];

  const fileName = `NominalRoll - ${course.courseNumber}th ${course.courseName}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);

  res.end();
}

module.exports = generateNominalRollExcel;
