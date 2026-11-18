const PdfPrinter = require("pdfmake");
const path = require("path");

const getCourseShortName = require("../getShortCourseName");

// Fonts
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../fonts/Roboto-Bold.ttf"),
    italics: path.join(__dirname, "../../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../../fonts/Roboto-Medium.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

function numberToWords(number) {
  const ones = [
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
  ];
  const teens = [
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
  const tens = [
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
  if (number < 10) return ones[number];
  if (number < 20) return teens[number - 10];
  if (number < 100) {
    return (
      tens[Math.floor(number / 10)] +
      (number % 10 !== 0 ? " " + ones[number % 10] : "")
    );
  }
  if (number < 1000) {
    return (
      ones[Math.floor(number / 100)] +
      " Hundred" +
      (number % 100 !== 0 ? " " + numberToWords(number % 100) : "")
    );
  }
  return number.toString();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function generatePracticalION(res, course, participantCount, signDoc) {
  const participantWords = numberToWords(participantCount);
  const courseNumber = `${course.courseNumber}${course.ordinal}`;
  const courseStartDate = formatDate(course.startDate);
  const courseEndDate = formatDate(course.endDate);
  const courseMonthYear = formatMonthYear(course.startDate);
  const courseDuration = String(course.courseDuration).padStart(2, "0");

  const requestedFromDate = new Date(course.startDate);
  requestedFromDate.setDate(requestedFromDate.getDate() + 1);

  const shortName = getCourseShortName(course.courseName);

  const courseDirector = signDoc?.authorities?.find(
    (authority) => authority.key === "courseDirector",
  );

  const courseDirectorName = courseDirector?.name || "Lavkush Kumar";
  const courseDirectorDesignation =
    courseDirector?.designation || "Scientist 'E'";

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [60, 50, 60, 50],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
    },

    content: [
      {
        text: "ION",
        alignment: "center",
        bold: true,
        decoration: "underline",
        fontSize: 14,
        margin: [0, 0, 0, 8],
      },

      {
        text: "(SDC Group)",
        alignment: "center",
        bold: true,
        decoration: "underline",
        fontSize: 13,
        margin: [0, 0, 0, 30],
      },

      {
        columns: [
          {
            width: "*",
            text: [
              `No. CFEES/SDC/Training/${course.year.year}/${course.courseNumber}`,
              {
                text: course.ordinal,
                sup: true,
                fontSize: 7,
              },
              `${shortName}`,
            ],
            fontSize: 10,
            alignment: "left",
          },

          {
            columns: [
              {
                text: "Dated :",
                width: "auto",
                fontSize: 10,
              },
              {
                text: `${courseMonthYear}`,
                width: "auto",
                margin: [20, 0, 0, 0],
                fontSize: 10,
              },
            ],
            width: "auto",
          },
        ],

        margin: [0, 0, 0, 35],
      },

      {
        table: {
          widths: [48, "*"],
          body: [
            [
              {
                text: "Subject: -",
                bold: true,
                margin: [0, 0, 0, 0],
              },
              {
                text: `Requirement of Fire Instructors for conducting the practical fire fighting classes / drills during ${courseNumber} ${course.courseName}`,
                bold: true,
                alignment: "left",
                margin: [0, 0, 0, 0],
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 25],
      },

      {
        text: [
          { text: "1. ", bold: true },
          `The "${courseNumber} ${course.courseName}" of ${courseDuration} weeks duration is scheduled to be conducted from ${courseStartDate} to ${courseEndDate}. Total ${participantCount} (${participantWords}) Nos of course participants are attended the subject course.`,
        ],
        alignment: "justify",
        lineHeight: 1.2,
        margin: [0, 0, 0, 18],
      },

      {
        text: [
          { text: "2. ", bold: true },
          `There is requirement of fire instructors for subject course for conducting the practical fire fighting classes / drills to the participants. The same is requested to be provided from ${formatDate(requestedFromDate)} to ${formatDate(course.endDate)}.`,
        ],
        alignment: "justify",
        lineHeight: 1.2,
        margin: [0, 0, 0, 18],
      },

      {
        text: [
          { text: "3. ", bold: true },
          "This is for your information & necessary action please.",
        ],
        alignment: "justify",
        lineHeight: 1.2,
        margin: [0, 0, 0, 0],
      },

      {
        text: [
          "\n\n\n\n",
          { text: `${courseDirectorName}\n`, bold: true },
          `${courseDirectorDesignation} & OIC SDC\n`,
          "For Director",
        ],
        alignment: "right",
        margin: [0, 0, 0, 45],
      },

      {
        text: [
          { text: "AD, SDC\n\n", bold: true, decoration: "underline" },
          "To\n\n",
          { text: "AD, FSG", bold: true, decoration: "underline" },
        ],
        alignment: "left",
      },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  const fileName = `Practical ION - ${courseNumber} ${course.courseName}.pdf`;
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generatePracticalION;
