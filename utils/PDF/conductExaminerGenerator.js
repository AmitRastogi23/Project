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

function generateConductExaminer(res, course, enrollments) {
  const maxMarks = course.conductConfig?.maxMarks || 15;
  const minMarks = course.conductConfig?.minMarks || 9;

  const formattedStart = new Date(course.startDate).toLocaleDateString(
    "en-GB",
    { day: "2-digit", month: "short", year: "numeric" },
  );
  const formattedEnd = new Date(course.endDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const tableHeader = [
    { text: "Roll.\nNo.", bold: true, alignment: "center", fontSize: 7 },
    {
      text: "PERSONNEL\nNUMBER & RANK",
      bold: true,
      alignment: "center",
      fontSize: 7,
    },
    { text: "NAME", bold: true, alignment: "center", fontSize: 7 },
    { text: "Marks\nObtained", bold: true, alignment: "center", fontSize: 7 },
  ];

  const content = [];

  // Max 40 students per page (20 Left, 20 Right)
  for (
    let pageIndex = 0;
    pageIndex < Math.ceil(enrollments.length / 40) || pageIndex === 0;
    pageIndex++
  ) {
    const pageEnrollments = enrollments.slice(
      pageIndex * 40,
      (pageIndex + 1) * 40,
    );

    const leftCol = pageEnrollments.slice(0, 20);
    const rightCol = pageEnrollments.slice(20, 40);

    const tableBody = [];

    for (let i = 0; i < 20; i++) {
      const leftEnr = leftCol[i];
      const rightEnr = rightCol[i];

      const leftRoll = pageIndex * 40 + i + 1;
      const rightRoll = pageIndex * 40 + 20 + i + 1;

      const leftData = leftEnr
        ? [
            { text: String(leftRoll), alignment: "center", fontSize: 7 },
            {
              text: `${leftEnr.applicantId.personnelNumber}\n${leftEnr.applicantId.rank}`,
              alignment: "center",
              fontSize: 7,
            },
            { text: leftEnr.applicantId.name, fontSize: 7 },
            { text: "", alignment: "center" },
          ]
        : [{ text: "" }, { text: "" }, { text: "" }, { text: "" }];

      const rightData = rightEnr
        ? [
            { text: String(rightRoll), alignment: "center", fontSize: 7 },
            {
              text: `${rightEnr.applicantId.personnelNumber}\n${rightEnr.applicantId.rank}`,
              alignment: "center",
              fontSize: 7,
            },
            { text: rightEnr.applicantId.name, fontSize: 7 },
            { text: "", alignment: "center" },
          ]
        : [{ text: "" }, { text: "" }, { text: "" }, { text: "" }];

      // Adding an empty spacer column in the middle to maintain gaps
      tableBody.push([
        ...leftData,
        { text: "", border: [false, false, false, false] }, // Spacer
        ...rightData,
      ]);
    }

    if (pageIndex > 0) {
      content.push({ text: "", pageBreak: "before" });
    }

    content.push(
      {
        columns: [
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 55,
          },
          {
            width: "*",
            stack: [
              {
                text: `${course.courseNumber}${course.ordinal || ""} ${course.courseName}`,
                bold: true,
                alignment: "center",
                fontSize: 12,
              },
              {
                text: `(${formattedStart} to ${formattedEnd})`,
                alignment: "center",
                fontSize: 9,
                margin: [0, 2, 0, 4],
              },
              {
                text: "SKILL DEVELOPMENT CENTRE, CFEES",
                bold: true,
                alignment: "center",
                fontSize: 11,
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
            ],
          },
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 55,
          },
        ],
      },
      {
        text: "CONDUCT & KEEN-NESS DURING COURSE",
        bold: true,
        alignment: "center",
        fontSize: 11,
        margin: [0, 12, 0, 8],
      },
      {
        columns: [
          { text: "", width: "*" },
          {
            width: "auto",
            stack: [
              {
                text: `Max. Marks: ${maxMarks}`,
                bold: true,
                alignment: "right",
                fontSize: 8,
              },
              {
                text: `Min. Marks: ${String(minMarks).padStart(2, "0")}`,
                bold: true,
                alignment: "right",
                fontSize: 8,
              },
            ],
          },
        ],
      },
      {
        columns: [
          {
            text: "Name of Examiner:................................................",
            bold: true,
            fontSize: 9,
            margin: [0, 15, 0, 10],
          },
          {
            text: "Dated:........................",
            bold: true,
            fontSize: 9,
            alignment: "right",
            margin: [0, 15, 0, 10],
          },
        ],
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true, // Prevent row from breaking into next page
          widths: [22, 72, "*", 40, 15, 22, 72, "*", 40], // Left 4 cols, Spacer, Right 4 cols
          body: [
            [
              ...tableHeader,
              { text: "", border: [false, false, false, false] },
              ...tableHeader, // Right side headers added
            ],
            ...tableBody,
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: (i, node) => {
            // i === 4 is spacer left border, i === 5 is spacer right border
            if (i === 4 || i === 5) return 0;
            return 0.5;
          },
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    );
  }

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [20, 20, 20, 20],
    defaultStyle: { font: "Roboto" },
    content: content,
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Examiner Sheet - ${course.courseNumber}.pdf"`,
  );
  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateConductExaminer;
