const PdfPrinter = require("pdfmake");
const path = require("path");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../fonts/Roboto-Bold.ttf"),
    italics: path.join(__dirname, "../../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../../fonts/Roboto-Medium.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

function generateAttendanceMarks(res, course, enrollments) {
  const tableBody = [
    [
      { text: "S.\nNo.", alignment: "center", bold: true, fontSize: 9 },
      { text: "Personnel\nNo.", alignment: "center", bold: true, fontSize: 9 },
      { text: "Rank", alignment: "center", bold: true, fontSize: 9 },
      { text: "Name", alignment: "center", bold: true, fontSize: 9 },
      {
        text: "Leaves Taken\n(Dates)",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
      { text: "Total\nLeaves", alignment: "center", bold: true, fontSize: 9 },
      { text: "Total\nMarks", alignment: "center", bold: true, fontSize: 9 },
      { text: "Sign", alignment: "center", bold: true, fontSize: 9 },
    ],
  ];

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

    tableBody.push([
      { text: String(index + 1), alignment: "center", fontSize: 9 },
      {
        text: enrollment.applicantId?.personnelNumber || "",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: enrollment.applicantId?.rank || "",
        alignment: "center",
        fontSize: 9,
      },
      {
        text: enrollment.applicantId?.name || "",
        alignment: "center",
        fontSize: 9,
      },
      { text: leaveDates, alignment: "center", fontSize: 8 },
      { text: String(totalLeaves), alignment: "center", fontSize: 9 },
      { text: totalMarks.toFixed(1), alignment: "center", fontSize: 9 },
      { text: "", alignment: "center", fontSize: 9 },
    ]);
  });

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [30, 30, 30, 30],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
    },
    content: [
      // ===== HEADER =====
      {
        columns: [
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 70,
            alignment: "left",
          },
          {
            width: "*",
            stack: [
              {
                text: [
                  `${course.courseNumber}`,
                  {
                    text: course.ordinal,
                    sup: true,
                    fontSize: 11,
                  },
                  ` ${course.courseName}`,
                ],
                style: "title",
              },
              {
                text: `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
                style: "date",
              },
              {
                text: "SKILL DEVELOPMENT CENTRE, CFEES",
                style: "heading",
              },
              {
                text: "DRDO, MINISTRY OF DEFENCE",
                alignment: "center",
                fontSize: 10,
              },
              {
                text: "PILKHUWA, HAPUR (U.P.)",
                alignment: "center",
                fontSize: 10,
              },
              {
                text: "PIN - 245304",
                alignment: "center",
                fontSize: 10,
              },
            ],
          },
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 70,
            alignment: "right",
          },
        ],
      },

      // ===== TITLE =====
      {
        text: "ATTENDANCE MARKS",
        style: "reportTitle",
      },

      // ===== MARKS CRITERIA (Single Row) =====
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "Max Marks: ", bold: true },
              "10/10    ",
              { text: "Min Passing: ", bold: true },
              "06/10    ",
              { text: "Per Leave Cut: ", bold: true },
              "0.5 marks",
            ],
            alignment: "center",
            fontSize: 10,
            margin: [0, 0, 0, 12],
          },
        ],
      },

      // ===== TABLE =====
      {
        table: {
          headerRows: 1,
          widths: [40, 90, 70, 120, "*", 60, 60, 60],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
    ],

    styles: {
      title: {
        fontSize: 18,
        bold: true,
        alignment: "center",
      },
      date: {
        fontSize: 11,
        alignment: "center",
        margin: [0, 4, 0, 8],
      },
      heading: {
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 3],
      },
      reportTitle: {
        fontSize: 16,
        bold: true,
        alignment: "center",
        decoration: "underline",
        margin: [0, 15, 0, 8],
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  const fileName = `AttendanceMarks - ${course.courseNumber}th ${course.courseName}.pdf`;
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateAttendanceMarks;
