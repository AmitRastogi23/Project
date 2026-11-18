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

function checkMark(received) {
  if (!received) {
    return "";
  }

  return {
    canvas: [
      {
        type: "line",
        x1: 2,
        y1: 7,
        x2: 6,
        y2: 11,
        lineWidth: 1.5,
      },
      {
        type: "line",
        x1: 6,
        y1: 11,
        x2: 13,
        y2: 2,
        lineWidth: 1.5,
      },
    ],
    alignment: "center",
  };
}

function generateItemsList(res, course, enrollments) {
  const tableBody = [
    [
      {
        text: "S.\nNO.",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Personnel\nNo.",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Rank",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Name",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Course\nKit",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Study\nMaterial",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Photograph",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
      {
        text: "Sign",
        alignment: "center",
        bold: true,
        fontSize: 7,
      },
    ],
  ];

  enrollments.forEach((enrollment, index) => {
    tableBody.push([
      {
        text: String(index + 1),
        alignment: "center",
        fontSize: 7,
      },
      {
        text: enrollment.applicantId.personnelNumber || "",
        alignment: "center",
        fontSize: 7,
      },
      {
        text: enrollment.applicantId.rank || "",
        alignment: "center",
        fontSize: 7,
      },
      {
        text: enrollment.applicantId.name || "",
        alignment: "center",
        fontSize: 7,
      },
      checkMark(enrollment.itemsReceived?.courseKit),
      checkMark(enrollment.itemsReceived?.studyMaterial),
      checkMark(enrollment.itemsReceived?.photograph),
      {
        text: "",
        alignment: "center",
        fontSize: 7,
      },
    ]);
  });

  const docDefinition = {
    pageSize: "A4",

    pageOrientation: "portrait",

    pageMargins: [30, 30, 30, 30],

    defaultStyle: {
      font: "Roboto",
      fontSize: 7,
    },

    content: [
      {
        columns: [
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 70,
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
              },

              {
                text: "PILKHUWA, HAPUR (U.P.)",
                alignment: "center",
              },

              {
                text: "PIN - 245304",
                alignment: "center",
              },
            ],
          },

          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 70,
          },
        ],
      },

      {
        text: "ITEMS RECEIPT",
        decoration: "underline",
        bold: true,
        style: "itemsList",
      },

      {
        table: {
          headerRows: 1,

          widths: [28, 62, 45, "*", 55, 68, 62, 55],

          body: tableBody,
        },

        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,

          paddingLeft: () => 2,
          paddingRight: () => 2,

          paddingTop: () => 4,
          paddingBottom: () => 7,
        },
      },

      {
        text: [
          `The above mentioned items have been received by the course participants during "${course.courseNumber}`,
          {
            text: course.ordinal,
            sup: true,
            fontSize: 6,
          },
          ` ${course.courseName}"`,
        ],
        fontSize: 10,
        margin: [0, 12, 0, 30],
      },

      {
        columns: [
          {
            width: "50%",
            stack: [
              {
                text: "(Dy Course Coordinator)",
                bold: true,
                decoration: "underline",
                alignment: "left",
              },
            ],
            fontSize: 10,
            margin: [0, 0, 0, 25],
          },
          {
            width: "50%",
            stack: [
              {
                text: "Course Coordinator",
                bold: true,
                decoration: "underline",
                alignment: "right",
              },
            ],
            fontSize: 10,
            margin: [0, 0, 0, 30],
          },
        ],
      },
      {
        columns: [
          {
            stack: [
              {
                text: "Course Director &",
                bold: true,
                decoration: "underline",
                alignment: "center",
              },
              {
                text: "OIC-SDC",
                alignment: "center",
                bold: true,
                decoration: "underline",
              },
            ],
            fontSize: 10,
            margin: [0, 0, 0, 15],
          },
        ],
      },
    ],

    styles: {
      title: {
        fontSize: 15,
        bold: true,
        alignment: "center",
      },

      date: {
        fontSize: 9,
        alignment: "center",
        margin: [0, 3, 0, 5],
      },

      heading: {
        fontSize: 12,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 3],
      },

      itemsList: {
        fontSize: 13,
        bold: true,
        alignment: "center",
        margin: [0, 12, 0, 12],
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader("Content-Type", "application/pdf");

  const fileName = `ItemsReceivingList - ${course.courseNumber}th ${course.courseName}.pdf`;

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  pdfDoc.pipe(res);

  pdfDoc.end();
}

module.exports = generateItemsList;
