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
  // UTC timezone use kar rahe hain taaki backend se frontend tak date shift na ho
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function buildBlock(title, course, data) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = course.courseName;

  const formattedDate = formatDateDDMMYYYY(data.date);
  const sessionStr = String(data.sessions).padStart(2, "0");
  const sessionText = `${sessionStr} session${data.sessions > 1 ? "s" : ""}`;
  const dateSessionStr = `${sessionText} ${formattedDate}`.trim();

  return {
    stack: [
      {
        text: title,
        bold: true,
        decoration: "underline",
        alignment: "center",
        fontSize: 14,
        margin: [0, 0, 0, 12],
      },
      {
        text: [
          `Received a sum of Rs.                 /- (                                                only) from `,
          `Director, Centre for Fire, Explosive & Environment Safety, Delhi`,
          ` for conducting Theory Lecture on `,
          { text: `'${data.title}'`, bold: true },
          ` for `,
          { text: `"${courseNumber} ${courseName}"`, bold: true },
          ` at DRDO Skill Development Centre (SDC), CFEES, Pilkhuwa as per the details given below:-`,
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
                text: [
                  `1.  Theory Lecture on `,
                  { text: `'${data.title}'`, bold: true },
                ],
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", alignment: "center", fontSize: 11 },
              { text: "Rs.           /-", alignment: "right", fontSize: 11 },
            ],
            [
              {
                text: `(${dateSessionStr})`,
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
            ],
            [
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
            ],
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
      {
        columns: [
          { width: "*", text: "Date:", fontSize: 11, margin: [0, 5, 0, 0] },
          {
            width: "auto",
            stack: [
              { text: "Signature", fontSize: 11, margin: [0, 0, 0, 4] },
              {
                text: `Name : ${data.name}`,
                fontSize: 11,
                margin: [0, 0, 0, 2],
              },
              {
                text: `Rank : ${data.rank}`,
                fontSize: 11,
                margin: [0, 0, 0, 2],
              },
              { text: `Address : ${data.address}`, fontSize: 11 },
            ],
            alignment: "left",
          },
        ],
        margin: [0, 5, 0, 0],
      },
    ],
  };
}

function generateTheoryHonorarium(res, course, data) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = course.courseName;

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 20, 40, 20],
    defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.2 },
    content: [
      buildBlock("RECEIPT", course, data),
      { text: "", margin: [0, 30, 0, 30] },
      buildBlock("DUPLICATE", course, data),
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const fileName = `Theory Honorarium - ${courseNumber} ${courseName}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateTheoryHonorarium;
