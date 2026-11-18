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

function formatDateDDMMYYYY(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildBlock(title, course, examDate, examType, instructor) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = course.courseName;

  const isFinal = examType === "FINAL-TERM";
  const examDisplayText = isFinal
    ? "Final-Term Theory & Practical Examination"
    : "Mid-Term Theory & Practical Examination";

  const formattedExamDate = examDate
    ? formatDateDDMMYYYY(examDate)
    : "____________";

  return {
    stack: [
      // Title
      {
        text: title,
        bold: true,
        decoration: "underline",
        alignment: "center",
        fontSize: 14,
        margin: [0, 0, 0, 12],
      },

      // Description
      {
        text: [
          `Received a sum of Rs.                 /- (                                                only) from `,
          `Director, Centre for Fire, Explosive & Environment Safety, Delhi`,
          ` for conducting ${examDisplayText} for `,
          { text: `"${courseNumber} ${courseName}"`, bold: true },
          ` at DRDO Skill Development Centre (SDC) CFEES, Pilkhuwa as per the details given below:-`,
        ],
        alignment: "justify",
        fontSize: 10.5,
        lineHeight: 1.3,
        margin: [0, 0, 0, 16],
      },

      {
        table: {
          widths: ["*", 20, 80],
          body: [
            [
              {
                text:
                  "1.  Invigilation duty in " +
                  (isFinal ? "Final" : "Mid") +
                  "-Term Exam",
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", alignment: "center", fontSize: 11 },
              { text: "Rs.           /-", alignment: "right", fontSize: 11 },
            ],
            [
              {
                text: `(${formattedExamDate})`,
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
            ],
            // Thoda khali space taaki Total image jaisa lage
            [
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
            ],
            // Total Row
            [
              {
                text: "Total",
                bold: true,
                alignment: "right",
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "-", bold: true, alignment: "center", fontSize: 11 },
              {
                text: "Rs.           /-",
                bold: true,
                alignment: "right",
                fontSize: 11,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function () {
            return 0;
          },
          vLineWidth: function () {
            return 0;
          },
          paddingLeft: function () {
            return 0;
          },
          paddingRight: function () {
            return 0;
          },
        },
        margin: [15, 0, 15, 25],
      },

      // Date and Signature block
      {
        columns: [
          {
            width: "*",
            text: "Date:",
            fontSize: 11,
            margin: [0, 5, 0, 0],
          },
          {
            width: "auto",
            stack: [
              { text: "Signature :-", fontSize: 11, margin: [0, 0, 0, 2] },
              {
                text: `Name : ${instructor.name}`,
                fontSize: 11,
                margin: [0, 0, 0, 2],
              },
              {
                text: `Rank : ${instructor.rank}`,
                fontSize: 11,
                margin: [0, 0, 0, 2],
              },
              { text: `Address : ${instructor.address}`, fontSize: 11 },
            ],
            alignment: "left",
          },
        ],
        margin: [0, 5, 0, 0],
      },
    ],
  };
}

function generateInvigilatorHonorarium(
  res,
  course,
  examDate,
  examType,
  instructor,
) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = course.courseName;

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 20, 40, 20],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.2,
    },
    content: [
      buildBlock("RECEIPT", course, examDate, examType, instructor),
      {
        text: "",
        margin: [0, 30, 0, 30],
      },
      buildBlock("DUPLICATE", course, examDate, examType, instructor),
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const fileName = `Invigilator Honorarium - ${courseNumber} ${courseName}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateInvigilatorHonorarium;
