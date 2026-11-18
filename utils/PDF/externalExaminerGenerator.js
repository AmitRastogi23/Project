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

const getCourseShortName = require("../getShortCourseName");

function formatDate(dateStr) {
  if (!dateStr) return "____________";
  const d = new Date(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatMonthYear(dateStr) {
  if (!dateStr) return "__________";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function formatDateForFilename(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

function toMilTime(time24) {
  if (!time24) return "____hrs";
  const [hStr, mStr] = String(time24).split(":");
  const h = String(parseInt(hStr, 10)).padStart(2, "0");
  const m = String(parseInt(mStr || "0", 10)).padStart(2, "0");
  return `${h}${m} hrs`;
}

function examTitle(examType) {
  return examType === "FINAL-TERM"
    ? "Final-Term Examination"
    : "Mid-Term Examination";
}

function examTypeShort(examType) {
  return examType === "FINAL-TERM" ? "FinalTerm" : "MidTerm";
}

function generateExternalExaminer(res, course, formData, signDoc) {
  const {
    address = "",
    examType = "MID-TERM",
    marks = "50",
    date = "",
    startTime = "10:00",
    endTime = "13:00",
  } = formData;

  const examDate = formatDate(date);
  const examMonthYear = formatMonthYear(date);
  const examName = examTitle(examType);
  const examShort = examTypeShort(examType);
  const courseShortName = getCourseShortName(course.courseName);

  const addressLines = address
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const startH = parseInt(startTime.split(":")[0], 10);
  const endH = parseInt(endTime.split(":")[0], 10);
  const durationHrs = String(Math.max(endH - startH, 1)).padStart(2, "0");

  const startDisplay = toMilTime(startTime);
  const endDisplay = toMilTime(endTime);

  const submitDate = date
    ? (() => {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() - 2);
        const dd = String(d.getUTCDate()).padStart(2, "0");
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getUTCFullYear()}`;
      })()
    : "____________";

  const courseNumber = course.courseNumber || 0;
  const courseName = course.courseName || "Course";
  const courseOrdinal = course.ordinal || "th";
  const courseYear = course.year?.year || new Date().getUTCFullYear();
  const startDateStr = formatDate(course.startDate);
  const endDateStr = formatDate(course.endDate);
  const durationWeeks = course.courseDuration || 8;

  const courseDirectorAuthority = signDoc?.authorities?.find(
    (a) => a.key === "courseDirector",
  );

  const signatoryName = courseDirectorAuthority?.name || "Lavkush Kumar";

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [50, 40, 50, 45],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.4,
    },
    content: [
      // ============ HEADER ============
      {
        columns: [
          // ----- LEFT: Phone / Fax / Email -----
          {
            width: "35%",
            columns: [
              {
                width: 50,
                text: "Phone :\nFax      :\n\nEmail  :",
                fontSize: 10,
              },
              {
                width: "*",
                text:
                  "09266158842\n" +
                  "23819547\n" +
                  "23819401\n" +
                  "oicsdpkw.cfees@gov.in",
                fontSize: 10,
              },
            ],
          },
          // ----- CENTER: logo -----
          {
            width: "25%",
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            fit: [80, 80],
            alignment: "center",
          },
          // ----- RIGHT: Govt heading -----
          {
            width: "40%",
            stack: [
              { text: "Government of India,", fontSize: 9, alignment: "left" },
              { text: "Ministry of Defence", fontSize: 9, alignment: "left" },
              {
                text: "Centre for Fire, Explosive &",
                fontSize: 9,
                alignment: "left",
              },
              {
                text: "Environment Safety (CFEES)",
                fontSize: 9,
                alignment: "left",
              },
              {
                text: "Skill Development Centre (SDC)",
                fontSize: 9,
                alignment: "left",
              },
              { text: "Pilkhuwa U.P, 245304", fontSize: 9, alignment: "left" },
            ],
            alignment: "right",
            bold: true,
            margin: [30, 0, 0, 0],
          },
        ],
      },

      // ============ REF NO & DATED ============
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
              `${courseShortName}\n`,
            ],
            fontSize: 9,
            bold: true,
          },
          {
            columns: [
              {
                text: "Dated: ",
                bold: true,
                width: "auto",
              },
              {
                text: examMonthYear,
                width: "auto",
                margin: [25, 0, 0, 0],
              },
            ],
            alignment: "right",
            margin: [80, 0, 0, 0],
          },
        ],
        margin: [0, 15, 0, 5],
      },

      // ============ ADDRESS ============
      {
        stack: addressLines.length
          ? addressLines.map((l) => ({
              text: l,
              fontSize: 9,
            }))
          : [{ text: "____________________________", fontSize: 11 }],
        alignment: "left",
        lineHeight: 1.15,
        margin: [0, 0, 0, 18],
        bold: true,
      },

      // ============ SUBJECT (YAHAN CHANGE KIYA HAI) ============
      // Table hata ke simple justify text use kiya, jaisa practical ION mein hai
      {
        text: [
          { text: "Subject: - ", bold: true },
          { text: "Request For Conducting " },
          { text: examName, bold: true },
          { text: ' of "' },
          { text: `${courseNumber}${courseOrdinal} `, bold: true },
          { text: courseName.toUpperCase(), bold: true },
          {
            text: '" as an External Examiner at Skill Development Centre (SDC), Pilkhuwa',
          },
        ],
        alignment: "justify",
        fontSize: 10,
        margin: [0, 0, 0, 14],
      },

      { text: "Dear Sir/Ma'am,", margin: [0, 0, 0, 12] },

      // Extra spacing before points
      { text: "", margin: [0, 0, 0, 5] },

      // ============ BODY ============
      {
        text: [
          "1.  DRDO Skill Development Centre, Pilkhuwa, is a premier training and testing institute of CFEES, DRDO to impart high standard of professional training to the personnel of Defence and of various Government Organizations. This is to bring your kind notice that this Centre conducts various specialized courses on Fire Safety and Fire Fighting. The centre is presently conducting ",
          {
            text: `"${courseNumber}${courseOrdinal} ${courseName} Course"`,
            bold: true,
          },
          " scheduled from ",
          { text: startDateStr, bold: true },
          " to ",
          { text: endDateStr, bold: true },
          " for the period of ",
          { text: String(durationWeeks), bold: true },
          " weeks.",
        ],
        alignment: "justify",
        fontSize: 10,
        margin: [20, 0, 0, 5],
      },
      {
        text: [
          "2.  You are requested to kindly conduct ",
          { text: examName.toLowerCase(), bold: true },
          " as an external examiner, which will consist of two parts namely theory exam and practical exam. Theory exam carrying ",
          { text: String(marks), bold: true },
          " marks will be of ",
          { text: `${durationHrs} hrs`, bold: true },
          " duration and will commence from ",
          { text: startDisplay, bold: true },
          " to ",
          { text: endDisplay, bold: true },
          " on ",
          { text: examDate, bold: true },
          ". Followed by practical examination after conduct of theory examination.",
        ],
        alignment: "justify",
        fontSize: 10,
        margin: [20, 0, 0, 5],
      },
      {
        text: [
          "3.  Further, it is also requested to set the question paper for theory exam of ",
          { text: `${durationHrs} hrs`, bold: true },
          " duration of ",
          { text: String(marks), bold: true },
          " marks in bilingual languages i.e. English & Hindi and forward the same to the undersigned under sealed cover latest by ",
          { text: submitDate, bold: true },
          " and personally supervise the conduct of theory exam from ",
          { text: `${startDisplay} to ${endDisplay}`, bold: true },
          " on ",
          { text: examDate, bold: true },
          ". The syllabus of the course and sample paper of previous examinations is enclosed for your ready reference.",
        ],
        alignment: "justify",
        fontSize: 10,
        margin: [20, 0, 0, 5],
      },
      {
        text: "4.  Honorarium will be paid as per Govt. rules",
        fontSize: 10,
        margin: [20, 0, 0, 5],
      },
      {
        text: "5.  A line of confirmation in this regard is solicited from your end.",
        fontSize: 10,
        margin: [20, 0, 0, 5],
      },

      {
        text: [
          { text: `${signatoryName}\n`, bold: true },
          { text: "Course Director & OIC SDC\n" },
          { text: "For Director" },
        ],
        alignment: "right",
        margin: [0, 40, 0, 0],
      },
    ],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  const fileName = `External Examiner - ${examShort} - ${course.courseNumber} ${course.courseName} - ${formatDateForFilename(date)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateExternalExaminer;
