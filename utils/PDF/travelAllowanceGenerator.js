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

// ═════════ Number to Words (Indian Format) ═════════
function numberToWords(num) {
  if (num === 0) return "Zero";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + inWords(n % 100) : "")
      );
    return "";
  }

  let str = "";
  let tempNum = Math.floor(num);

  // Crores
  if (tempNum >= 10000000) {
    str += inWords(Math.floor(tempNum / 10000000)) + " Crore ";
    tempNum %= 10000000;
  }
  // Lakhs
  if (tempNum >= 100000) {
    str += inWords(Math.floor(tempNum / 100000)) + " Lakh ";
    tempNum %= 100000;
  }
  // Thousands
  if (tempNum >= 1000) {
    str += inWords(Math.floor(tempNum / 1000)) + " Thousand ";
    tempNum %= 1000;
  }
  // Hundreds & Tens
  if (tempNum > 0) {
    str += inWords(tempNum);
  }

  str = str.trim();

  // Decimals (Paisa) handle karne ke liye
  const decimalPart = Math.round((num - Math.floor(num)) * 100);
  if (decimalPart > 0) {
    str += ` and ${inWords(decimalPart)} Paisa`;
  }

  return str + " Only";
}

// Number ko comma format mein badalne ke liye (jaise 1680 -> 1,680)
function formatIndianCurrency(num) {
  return new Intl.NumberFormat("en-IN").format(num);
}

function buildBlock(title, course, data) {
  const courseNumber = `${course.courseNumber}${course.ordinal || ""}`;
  const courseName = (course.courseName || "").toUpperCase();

  // Dynamic text based on visit type
  let purposeText = "";
  if (data.visitType === "practical") {
    purposeText = "Practical Classes";
  } else if (data.visitType === "theory") {
    purposeText = `Theory Lecture on '${data.lectureTitle}'`;
  } else if (data.visitType === "final") {
    purposeText = "FINAL TERM THEORY & PRACTICAL EXAM";
  } else if (data.visitType === "mid") {
    purposeText = "MID TERM THEORY & PRACTICAL EXAM";
  }

  const amountInWords = numberToWords(data.totalAmount);
  const formattedAmount = formatIndianCurrency(data.totalAmount);

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
          `Received a sum of Rs. ${formattedAmount}/- (${amountInWords}) from `,
          `Director, Centre for Fire, Explosive & Environment Safety, Delhi`,
          ` as Transport Allowance for conducting `,
          { text: purposeText, bold: true },
          ` for `,
          { text: `"${courseNumber} ${courseName}"`, bold: true },
          ` at DRDO Skill Development Centre (SDC) CFEES, Pilkhuwa as per the details given below:-`,
        ],
        alignment: "justify",
        fontSize: 10.5,
        lineHeight: 1.3,
        margin: [0, 0, 0, 16],
      },

      // Points Table
      {
        table: {
          widths: ["*", 20, 80],
          body: [
            [
              {
                text: `1.  Transport Allowance from home to SDC Pilkhuwa & Back`,
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", alignment: "center", fontSize: 11 },
              {
                text: `Rs. ${formattedAmount}/-`,
                alignment: "right",
                fontSize: 11,
              },
            ],
            [
              {
                text: `     (@ ${data.ratePerKm} Rs/ km x ${data.distance} km to and fro distance)`,
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", fontSize: 11 },
              { text: "", fontSize: 11 },
            ],
            // Khali space
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
                alignment: "center",
                fontSize: 11,
                margin: [0, 0, 0, 0],
              },
              { text: "", bold: true, alignment: "center", fontSize: 11 },
              {
                text: `Rs. ${formattedAmount}/-`,
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

function generateTravelAllowance(res, course, data) {
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
  const fileName = `Travelling Allowance - ${courseNumber} ${courseName}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateTravelAllowance;
