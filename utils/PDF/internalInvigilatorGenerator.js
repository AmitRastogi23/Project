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

function getCourseShortName(courseName) {
  const ignoredWords = new Set(["in", "of", "and", "the", "for", "on", "to"]);
  return courseName
    .split(/\s+/)
    .filter((word) => word && !ignoredWords.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "____________";
  const d = new Date(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// 👇 NEW: Dynamic Month & Year for Dated line
function formatMonthYear(dateStr) {
  if (!dateStr) return "__________";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function formatDateLong(dateStr) {
  if (!dateStr) return "____________";
  const d = new Date(dateStr);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
}

function examTitle(examType) {
  return examType === "FINAL-TERM"
    ? "Final-Term Examination"
    : "Mid-Term Examination";
}

function generateInternalInvigilator(res, course, formData, signDoc) {
  const { examType = "MID-TERM", date = "" } = formData;

  const examName = examTitle(examType);
  const examDateLong = formatDateLong(date);
  const examMonthYear = formatMonthYear(date); // 👈 Call dynamic month year

  const courseNumber = course.courseNumber || 0;
  const courseName = course.courseName || "Course";
  const courseOrdinal = course.ordinal || "th";
  const courseYear = course.year?.year || new Date().getUTCFullYear();
  const courseShortName = getCourseShortName(courseName);
  const startDateStr = formatDate(course.startDate);
  const endDateStr = formatDate(course.endDate);
  const durationWeeks = course.courseDuration || 8;

  // Signatory
  const courseDirectorAuthority = signDoc?.authorities?.find(
    (a) => a.key === "courseDirector",
  );
  const adSdcAuthority = signDoc?.authorities?.find((a) => a.key === "adSdc");
  const osDirectorAuthority = signDoc?.authorities?.find(
    (a) => a.key === "osDirector",
  );

  const signatoryName = courseDirectorAuthority?.name || "";

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [70, 50, 70, 60],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.4,
    },
    content: [
      // ============ TOP CENTER HEADINGS ============
      {
        text: "NOTE",
        bold: true,
        decoration: "underline",
        alignment: "center",
        fontSize: 12,
        margin: [0, 0, 0, 6],
      },
      {
        text: "Skill Development Centre (SDC) GROUP",
        bold: true,
        decoration: "underline",
        alignment: "center",
        fontSize: 11,
        margin: [0, 0, 0, 22],
      },

      // ============ SUBJECT (indented like image) ============
      {
        margin: [0, 0, 0, 22],
        text: [
          { text: "Subject: ", bold: true },
          {
            text: `Request for Nomination of Internal Invigilators for conducting ${examName} of "`,
          },
          { text: `${courseNumber}${courseOrdinal} ${courseName}`, bold: true },
          { text: '" at SDC, Pilkhuwa.' },
        ],
      },

      // ============ DATE (right) - DYNAMIC MONTH/YEAR ============
      {
        columns: [
          {
            width: "*",
            text: "",
          },
          {
            width: "auto",
            columns: [
              {
                text: "Dated: ",
                bold: true,
                width: "auto",
              },
              {
                text: examMonthYear, // 👈 Dynamic Month & Year
                width: "auto",
                margin: [25, 0, 0, 0], // Gap same as external examiner
              },
            ],
          },
        ],
        margin: [0, 0, 0, 18],
      },

      // ============ LETTER NO ============
      {
        text: [
          { text: "No: ", bold: true },
          `CFEES/SDC/TRAINING /${courseYear}/${courseNumber}`,
          { text: courseOrdinal, sup: true, fontSize: 7 },
          ` ${courseShortName}`,
        ],
        margin: [0, 0, 0, 22],
      },

      // ============ POINTS ============
      {
        ol: [
          {
            text: [
              {
                text: `"${courseNumber}${courseOrdinal} ${courseName}"`,
                bold: true,
              },
              " is being conducted at Skill Development Centre, Pilkhuwa from ",
              { text: startDateStr, bold: true },
              " to ",
              { text: endDateStr, bold: true },
              " for the period of ",
              { text: String(durationWeeks).padStart(2, "0"), bold: true },
              " weeks.",
            ],
            margin: [0, 0, 0, 10],
          },
          {
            text: [
              `${examName} for above said course is scheduled to be held on `,
              { text: examDateLong, bold: true },
              ". In order to conduct the examination in a transparent and fair manner at SDC, CFEES, Pilkhuwa. It is necessary to depute two officers as invigilators for both theory and practical examinations of above said course. Honorarium shall be paid to officials as per approved sanction.",
            ],
            margin: [0, 0, 0, 10],
          },
          {
            text: "Put-up for the nomination as per para-2 above please.",
            margin: [0, 0, 0, 55],
          },
        ],
        fontSize: 10,
      },

      // ============ COURSE DIRECTOR SIGNATURE ============
      {
        text: [
          { text: `${signatoryName}\n`, bold: true },
          { text: "Course Director & OIC SDC" },
        ],
        alignment: "right",
        margin: [0, 0, 0, 45],
      },

      // ============ BOTTOM SIGNATORIES ============
      {
        text: [
          { text: "AD. SDC", bold: true, decoration: "underline" },
          "\n\n\n",
          { text: "OS & DIRECTOR", bold: true, decoration: "underline" },
        ],
        alignment: "left",
      },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const fileName = `Internal Invigilator - ${examName} - ${course.courseNumber} ${course.courseName}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateInternalInvigilator;
