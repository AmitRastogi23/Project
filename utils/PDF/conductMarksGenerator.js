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

function generateConductMarks(res, course, enrollments, results) {
  const config = course.conductConfig || {
    maxMarks: 15,
    minMarks: 9,
    evaluators: [],
  };
  const maxMarks = config.maxMarks;
  const minMarks = String(config.minMarks).padStart(2, "0");

  const evaluators = config.evaluators || [];
  const e1Name = evaluators[0]?.name || "Evaluator 1";
  const e2Name = evaluators[1]?.name || "Evaluator 2";
  const e3Name = evaluators[2]?.name || "Evaluator 3";

  // "Sh. Lavkush Kumar, Sh. Rohit Arse & Sub Devender Kumar"
  const examNameText = `${e1Name}, ${e2Name} & ${e3Name}`;

  const formattedStart = new Date(course.startDate).toLocaleDateString(
    "en-GB",
    { day: "2-digit", month: "short", year: "numeric" },
  );
  const formattedEnd = new Date(course.endDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const currentMonthYear = new Date().toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  // Map Results by enrollmentId for quick lookup
  const resultsMap = new Map();
  if (results) {
    results.forEach((r) => resultsMap.set(r.enrollmentId.toString(), r));
  }

  // Build Table Body
  const tableBody = [];

  // Row 1: "CONDUCT & KEEN-NESS DURING COURSE" and "TOTAL MARKS OBTAINED (Average)"
  // Note: In pdfmake, colSpan used for visual spanning but structure must be flat
  tableBody.push([
    { text: "", border: [true, true, true, false] },
    { text: "", border: [true, true, true, false] },
    { text: "", border: [true, true, true, false] },
    {
      text: "CONDUCT & KEEN-NESS DURING COURSE",
      colSpan: 3,
      alignment: "center",
      bold: true,
      fontSize: 8,
      border: [true, true, true, false],
    },
    { text: "", border: [true, true, true, false] }, // Hidden colSpan
    { text: "", border: [true, true, true, false] }, // Hidden colSpan
    {
      text: "TOTAL MARKS\nOBTAINED\n(Average)",
      rowSpan: 2,
      alignment: "center",
      bold: true,
      fontSize: 8,
      border: [true, true, true, true],
    },
  ]);

  // Row 2: Evaluator Names
  tableBody.push([
    { text: "", border: [true, false, true, true] },
    { text: "", border: [true, false, true, true] },
    { text: "", border: [true, false, true, true] },
    {
      text: `${e1Name}\n(${minMarks}/${maxMarks})`,
      alignment: "center",
      fontSize: 7,
      border: [true, false, true, true],
    },
    {
      text: `${e2Name}\n(${minMarks}/${maxMarks})`,
      alignment: "center",
      fontSize: 7,
      border: [true, false, true, true],
    },
    {
      text: `${e3Name}\n(${minMarks}/${maxMarks})`,
      alignment: "center",
      fontSize: 7,
      border: [true, false, true, true],
    },
    { text: "", border: [true, false, true, true] }, // Hidden by rowSpan
  ]);

  // Fill Data Rows
  enrollments.forEach((enr, idx) => {
    const result = resultsMap.get(enr._id.toString());
    let m1 = "",
      m2 = "",
      m3 = "",
      avg = "";

    if (result && result.conductKeenness && result.conductKeenness.marks) {
      const marks = result.conductKeenness.marks;
      marks.forEach((m) => {
        if (m.evaluatorKey === "eval_1") m1 = m.marks;
        if (m.evaluatorKey === "eval_2") m2 = m.marks;
        if (m.evaluatorKey === "eval_3") m3 = m.marks;
      });
      if (result.conductKeenness.average !== null) {
        avg = result.conductKeenness.average.toFixed(2); // e.g. "12.50"
      }
    }

    tableBody.push([
      { text: String(idx + 1), alignment: "center", fontSize: 8 },
      {
        text: `${enr.applicantId.personnelNumber}\n${enr.applicantId.rank}`,
        alignment: "center",
        fontSize: 8,
      },
      { text: enr.applicantId.name, fontSize: 8 },
      { text: String(m1), alignment: "center", fontSize: 8 },
      { text: String(m2), alignment: "center", fontSize: 8 },
      { text: String(m3), alignment: "center", fontSize: 8 },
      {
        text: avg ? `${avg} / ${maxMarks}` : "",
        alignment: "center",
        bold: true,
        fontSize: 8,
      },
    ]);
  });

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [30, 30, 30, 30],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    content: [
      // Header
      {
        columns: [
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 60,
          },
          {
            width: "*",
            stack: [
              {
                text: `${course.courseNumber}${course.ordinal || ""} ${course.courseName.toUpperCase()}`,
                bold: true,
                alignment: "center",
                fontSize: 14,
              },
              {
                text: `(${formattedStart} to ${formattedEnd})`,
                alignment: "center",
                fontSize: 10,
                margin: [0, 2, 0, 4],
              },
              {
                text: "SKILL DEVELOPMENT CENTRE, CFEES",
                bold: true,
                alignment: "center",
                fontSize: 12,
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
            ],
          },
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 60,
          },
        ],
      },

      // Title & Marks Info
      {
        columns: [
          {
            width: "*",
            text: "Conduct & Keen-ness",
            bold: true,
            decoration: "underline",
            alignment: "left",
            fontSize: 12,
            margin: [100, 15, 0, 0],
          },
          {
            width: "auto",
            stack: [
              { text: `Max Mark: ${maxMarks}`, bold: true, alignment: "right" },
              {
                text: `Min. Passing Marks:  ${minMarks}`,
                bold: true,
                alignment: "right",
              },
            ],
          },
        ],
      },

      // Name of Examiner & Dated
      {
        columns: [
          {
            text: `Name of Examiner: ${examNameText}`,
            bold: true,
            fontSize: 10,
            margin: [0, 15, 0, 10],
          },
          {
            text: `Dated:     ${currentMonthYear}`,
            bold: true,
            fontSize: 10,
            alignment: "right",
            margin: [0, 15, 0, 10],
          },
        ],
      },

      // Main Table
      {
        table: {
          headerRows: 2,
          widths: [25, 80, "*", 55, 55, 55, 65],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Conduct Marks - ${course.courseNumber}.pdf"`,
  );
  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateConductMarks;
