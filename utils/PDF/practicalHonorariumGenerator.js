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

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildTableBody(summaryRows) {
  const tableBody = [
    [
      { text: "S.No.", bold: true, alignment: "center", fontSize: 7.5 },
      {
        text: "Topic of Practical Session",
        bold: true,
        alignment: "center",
        fontSize: 7.5,
      },
      {
        text: "No of Session with Date",
        bold: true,
        alignment: "center",
        fontSize: 7.5,
      },
      { text: "Amount", bold: true, alignment: "center", fontSize: 7.5 },
    ],
  ];

  let totalSessions = 0;

  summaryRows.forEach((row, index) => {
    totalSessions += row.count;

    const dateRange =
      row.startDate.getTime() === row.endDate.getTime()
        ? formatDate(row.startDate)
        : `${formatDate(row.startDate)} to ${formatDate(row.endDate)}`;

    const countText = `${String(row.count).padStart(2, "0")} sessions`;

    tableBody.push([
      { text: String(index + 1), alignment: "center", fontSize: 7.5 },
      { text: row.title, fontSize: 7.5 },
      { text: `${countText} ${dateRange}`, fontSize: 7.5, alignment: "center" },
      { text: "", alignment: "center", fontSize: 7.5 }, // Amount column blank
    ]);
  });

  // Total row
  tableBody.push([
    { text: "", colSpan: 2, alignment: "right", fontSize: 7.5 },
    { text: "" },
    {
      text: `Total (${totalSessions} Sessions)`,
      bold: true,
      alignment: "center",
      fontSize: 7.5,
    },
    { text: "", bold: true, alignment: "center", fontSize: 7.5 }, // Total amount blank
  ]);

  return tableBody;
}

function buildBlock(title, course, instructor, summaryRows) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = course.courseName;

  return {
    stack: [
      // Title
      {
        text: title,
        bold: true,
        decoration: "underline",
        alignment: "center",
        fontSize: 10, // 11 se 10 kiya
        margin: [0, 0, 0, 6],
      },

      // Description
      {
        text: [
          `Received a sum of Rs. __________/- (Rupees ________________________________________________ only) from `,
          {
            text: "Director, Centre for Fire, Explosive & Environment Safety, Delhi",
            bold: true,
          },
          ` for conducting Practical Classes on the following topics for `,
          { text: `"${courseNumber} ${courseName}"`, bold: true },
          ` at DRDO Skill Development Centre (SDC) CFEES, Pilkhuwa as per the details given below:-`,
        ],
        alignment: "justify",
        fontSize: 7.5, // 8.5 se 7.5 kiya
        lineHeight: 1.15, // Line height kam ki
        margin: [0, 0, 0, 6],
      },

      // Table
      {
        table: {
          headerRows: 1,
          widths: [30, 220, 160, 60],
          body: buildTableBody(summaryRows),
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000",
          vLineColor: () => "#000",
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 1.5, // Padding kam ki
          paddingBottom: () => 1.5,
        },
        margin: [0, 0, 0, 8],
      },

      // Date and Signature
      {
        columns: [
          {
            width: "*",
            text: "Date:",
            fontSize: 8, // 9 se 8 kiya
            bold: true,
            margin: [0, 4, 0, 0],
          },
          {
            width: "auto",
            stack: [
              { text: "Signature", fontSize: 8, margin: [0, 0, 0, 1] },
              {
                text: `Name: ${instructor.name}`,
                fontSize: 8,
                margin: [0, 0, 0, 1],
              },
              {
                text: `Rank: ${instructor.rank}`,
                fontSize: 8,
                margin: [0, 0, 0, 1],
              },
              { text: `Address: ${instructor.address}`, fontSize: 8 },
            ],
            alignment: "left",
          },
        ],
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

function generatePracticalHonorarium(res, course, instructor, summaryRows) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = course.courseName;

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 20, 40, 20], // Upar-neeche ka margin aur kam kiya (30 se 20)
    defaultStyle: {
      font: "Roboto",
      fontSize: 8, // Default font 9 se 8 kiya
      lineHeight: 1.15,
    },
    content: [
      buildBlock("RECEIPT", course, instructor, summaryRows),

      // Middle spacer
      {
        text: "",
        margin: [0, 10, 0, 10], // Spacer bhi 15 se 10 kiya
      },

      buildBlock("DUPLICATE", course, instructor, summaryRows),
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const fileName = `Practical Honorarium - ${courseNumber} ${courseName}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generatePracticalHonorarium;
