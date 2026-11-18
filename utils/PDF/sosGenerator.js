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

function generateSOS(res, course, enrollments) {
  // Build table body
  const tableBody = [
    [
      { text: "S.\nNo.", alignment: "center", bold: true, fontSize: 9 },
      { text: "Personnel\nNo.", alignment: "center", bold: true, fontSize: 9 },
      { text: "Rank", alignment: "center", bold: true, fontSize: 9 },
      { text: "Name", alignment: "center", bold: true, fontSize: 9 },
      { text: "SOS Date", alignment: "center", bold: true, fontSize: 9 },
      { text: "SOS Reason", alignment: "center", bold: true, fontSize: 9 }, // New column
    ],
  ];

  enrollments.forEach((enrollment, index) => {
    const sosDate = enrollment.SOS
      ? new Date(enrollment.SOS).toLocaleDateString("en-IN")
      : "--------";

    const sosReason = enrollment.SOSReason || "--------";

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
      { text: sosDate, alignment: "center", fontSize: 9 },
      { text: sosReason, alignment: "center", fontSize: 9 }, // SOS Reason data
    ]);
  });

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
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
            width: 55,
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
                    fontSize: 10,
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
                fontSize: 9,
              },
              {
                text: "PILKHUWA, HAPUR (U.P.)",
                alignment: "center",
                fontSize: 9,
              },
              {
                text: "PIN - 245304",
                alignment: "center",
                fontSize: 9,
              },
            ],
          },
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 55,
            alignment: "right",
          },
        ],
        columnGap: 6,
      },

      // ===== TITLE =====
      {
        text: "STUCK OF SERVICE (SOS) SHEET",
        style: "reportTitle",
      },

      // ===== TABLE (Updated with SOS Reason) =====
      {
        table: {
          headerRows: 1,
          widths: [40, 85, 60, "*", 80, "*"], // Adjusted widths for new column
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.7,
          vLineWidth: () => 0.7,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },

      // ===== FOOTER NOTES =====
      {
        text: "Note: This is a system-generated report for record purposes.",
        fontSize: 8,
        alignment: "center",
        margin: [0, 15, 0, 0],
        color: "#666666",
      },
    ],

    styles: {
      title: {
        fontSize: 16,
        bold: true,
        alignment: "center",
      },
      date: {
        fontSize: 10,
        alignment: "center",
        margin: [0, 3, 0, 6],
      },
      heading: {
        fontSize: 12,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 2],
      },
      reportTitle: {
        fontSize: 14,
        bold: true,
        alignment: "center",
        decoration: "underline",
        margin: [0, 12, 0, 10],
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  const fileName = `SOSReport - ${course.courseNumber}th ${course.courseName}.pdf`;
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateSOS;
