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

function checkMark(submitted) {
  if (!submitted) {
    return "";
  }

  return {
    canvas: [
      {
        type: "line",
        x1: 2,
        y1: 6,
        x2: 5,
        y2: 9,
        lineWidth: 1.2,
      },
      {
        type: "line",
        x1: 5,
        y1: 9,
        x2: 11,
        y2: 2,
        lineWidth: 1.2,
      },
    ],
    alignment: "center",
  };
}

function generateDocumentsList(res, course, enrollments) {
  const tableBody = [
    [
      {
        text: "S.\nNO.",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
      {
        text: "Personnel\nNo.",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
      {
        text: "Rank",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
      {
        text: "Name",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
      {
        text: "Movement\nOrder",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "3 Yrs\nResidual\nService\nCertificate",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Medical\nCertificate",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Qualification\nDocuments",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Previous\nCourse\nCertificate",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Passport\nSize\nPhoto",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Sign",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
    ],
  ];

  enrollments.forEach((enrollment, index) => {
    tableBody.push([
      {
        text: String(index + 1),
        alignment: "center",
        fontSize: 8,
      },
      {
        text: enrollment.applicantId.personnelNumber || "",
        alignment: "center",
        fontSize: 8,
      },
      {
        text: enrollment.applicantId.rank || "",
        alignment: "center",
        fontSize: 8,
      },
      {
        text: enrollment.applicantId.name || "",
        alignment: "center",
        fontSize: 8,
      },
      checkMark(enrollment.documentsReceived?.movementOrder),
      checkMark(enrollment.documentsReceived?.resServiceCertificate),
      checkMark(enrollment.documentsReceived?.medCertificate),
      checkMark(enrollment.documentsReceived?.qualificationDocuments),
      checkMark(enrollment.documentsReceived?.prevCourseCertificate),
      checkMark(enrollment.documentsReceived?.passportPhoto),
      {
        text: "",
        alignment: "center",
        fontSize: 8,
      },
    ]);
  });

  // Get ordinal suffix for course number
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [30, 30, 30, 30],

    defaultStyle: {
      font: "Roboto",
      fontSize: 8,
    },

    content: [
      {
        columns: [
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 65,
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
                text: `(${new Date(course.startDate).toLocaleDateString(
                  "en-GB",
                )} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
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
            width: 65,
          },
        ],
      },
      {
        text: "(DOCUMENTS SUBMISSION LIST)",
        style: "itemsList",
      },
      {
        table: {
          headerRows: 1,

          widths: [
            30, // S. No.
            70, // Personnel No.
            55, // Rank
            100, // Name
            60, // Movement Order
            70, // 3 Yrs Residual Service
            55, // Medical Certificate
            70, // Qualification Documents
            65, // Previous Course Certificate
            60, // Passport Size Photo
            55, // Sign
          ],

          body: tableBody,
        },

        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 4,
          paddingBottom: () => 6,
        },
      },
      {
        text: [
          `The above mentioned documents have been submitted by the course participants during "${course.courseNumber}`,
          {
            text: course.ordinal,
            sup: true,
            fontSize: 6,
          },
          ` ${course.courseName}"`,
        ],
        fontSize: 9,
        alignment: "left",
        margin: [0, 15, 0, 0],
        bold: true,
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
        margin: [0, 3, 0, 5],
      },
      heading: {
        fontSize: 13,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 3],
      },
      itemsList: {
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 12, 0, 12],
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader("Content-Type", "application/pdf");

  const fileName = `Documents Submission List - ${course.courseNumber}th ${course.courseName}.pdf`;

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateDocumentsList;
