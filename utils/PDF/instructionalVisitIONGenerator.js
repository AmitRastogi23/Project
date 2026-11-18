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

// Course start/end date -> "Jun 2026"
function formatMonthYear(dateStr) {
  if (!dateStr) return "____________";
  const d = new Date(dateStr);
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
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// 👇 NEW: Format visit date for "Dated:"
function formatDatedMonthYear(dateStr) {
  if (!dateStr) return "__________";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

// Visit date -> "07 Aug 2026"
function formatVisitDate(dateStr) {
  if (!dateStr) return "____________";
  const d = new Date(dateStr);
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
  return `${String(d.getUTCDate()).padStart(2, "0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// 10:00 -> "1000 hrs"
function toMilTime(time24) {
  if (!time24) return "____ hrs";
  const [hStr, mStr] = String(time24).split(":");
  const h = String(parseInt(hStr, 10)).padStart(2, "0");
  const m = String(parseInt(mStr || "0", 10)).padStart(2, "0");
  return `${h}${m} hrs`;
}

function generateInstructionalVisitION(
  res,
  course,
  visit,
  signDoc,
  participantCount,
  instructorCount = 2,
) {
  const courseNumber = course.courseNumber || 0;
  const courseName = course.courseName || "Course";
  const courseOrdinal = course.ordinal || "th";
  const courseYear = course.year?.year || new Date().getUTCFullYear();
  const courseShortName = getCourseShortName(courseName);

  const startDateStr = formatMonthYear(course.startDate);
  const endDateStr = formatMonthYear(course.endDate);
  const durationWeeks = course.courseDuration || 8;

  const visitDateStr = formatVisitDate(visit.date);
  const visitMonthYear = formatDatedMonthYear(visit.date); // 👈 Dynamic Month/Year
  const visitLocation = visit.location || "____________";
  const visitTimeDisplay = toMilTime(visit.startTime || "10:00");

  const courseDirectorAuthority = signDoc?.authorities?.find(
    (a) => a.key === "courseDirector",
  );
  const signatoryName = courseDirectorAuthority?.name || "";

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [60, 50, 60, 60],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      lineHeight: 1.4,
    },
    content: [
      // ============ TOP CENTER HEADING ============
      {
        text: "ION",
        bold: true,
        decoration: "underline",
        alignment: "center",
        fontSize: 12,
        margin: [0, 0, 0, 24],
      },

      // ============ NO + DATED ============
      {
        columns: [
          {
            width: "*",
            text: [
              { text: "No. " },
              `CFEES/SDC/Training/${courseYear}/${courseNumber}`,
              { text: courseOrdinal, sup: true, fontSize: 7 },
              ` ${courseShortName}`,
            ],
          },
          {
            width: "auto",
            // 👇 DYNAMIC DATE LOGIC APPLIED HERE
            columns: [
              {
                text: "Dated: ",
                width: "auto",
              },
              {
                text: visitMonthYear,
                width: "auto",
                margin: [25, 0, 0, 0],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // ============ SUBJECT ============
      {
        text: [
          { text: "Subject: ", bold: true },
          { text: "- Request for Instructional Visit at " },
          { text: visitLocation },
          ",",
        ],
        margin: [0, 0, 0, 20],
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
              " is being conducted at Skill Development Centre, Pilkhua from ",
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
              "Instructional visit for this course is planned to be held on ",
              { text: visitDateStr, bold: true },
              " at ",
              { text: visitLocation, bold: true, italics: true },
              ". Total ",
              { text: String(participantCount), bold: true },
              " Nos of trainees along with ",
              { text: String(instructorCount).padStart(2, "0"), bold: true },
              " Nos of instructors will be arriving at CFEES, Delhi around 1000 hrs. It is kindly requested to allow them to enter inside CFEES premises. List of the trainees along with instructors is attached herewith.",
            ],
            margin: [0, 0, 0, 10],
          },
          {
            text: "It is also requested to allow the photographer along with his camera for group photograph. Details of photographer shall be forwarded through Visitor Management System along with camera.",
            margin: [0, 0, 0, 60],
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
        margin: [0, 0, 0, 40],
      },

      // ============ BOTTOM SECTION ============
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "AD, SDC",
                bold: true,
                decoration: "underline",
                margin: [0, 0, 0, 20],
              },
              {
                text: [
                  { text: "To,\n", bold: true },
                  { text: "AD, FSG\n" },
                  { text: "AD, FAG\n" },
                  { text: "\n" },
                  { text: "Copy to\n", bold: true },
                  { text: "AD, Security" },
                ],
              },
            ],
          },
          {
            width: 200,
            text: "",
          },
        ],
      },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const safeLocation = (visit.location || "Visit")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 30);

  const fileName = `ION - ${courseNumber} ${courseName} - ${safeLocation}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateInstructionalVisitION;
