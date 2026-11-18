const PdfPrinter = require("pdfmake");
const path = require("path");

const Faculty = require("../../models/faculty");
const mongoose = require("mongoose");

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../fonts/Roboto-Bold.ttf"),
    italics: path.join(__dirname, "../../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../../fonts/Roboto-Medium.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

const LOGO = path.join(__dirname, "../../public/images/cfees-logo.png");

function getOrdinal(n) {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "TH";
  return { 1: "ST", 2: "ND", 3: "RD" }[n % 10] || "TH";
}

function formatMonthYear(dateStr) {
  if (!dateStr) return "____________";
  const d = new Date(dateStr);
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Normalize lecture title — strip numbers, hyphens, slashes, extra spaces
function normalizeTitle(title) {
  if (!title) return "Untitled Lecture";
  const normalized = title
    .trim()
    .replace(/\d+/g, "") // remove all digits
    .replace(/[-/\\:]+/g, " ") // remove hyphens, slashes, colons
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
  return normalized || "Untitled Lecture";
}

function generateTheoryLectures(res, course, schedule, signDoc) {
  return Promise.resolve().then(async () => {
    const courseNumber = course.courseNumber || 0;
    const courseName = (course.courseName || "COURSE").toUpperCase();
    const courseOrdinal = getOrdinal(courseNumber);
    const startMonthYear = formatMonthYear(course.startDate);
    const endMonthYear = formatMonthYear(course.endDate);
    const durationWeeks = String(course.courseDuration || 0).padStart(2, "0");

    // ==========================================================
    // PASS 1: Collect all valid faculty ObjectIds from THEORY sessions
    // ==========================================================
    const facultyIds = new Set();

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type !== "THEORY") continue;
          if (session.faculty && mongoose.isValidObjectId(session.faculty)) {
            facultyIds.add(session.faculty.toString());
          }
        }
      }
    }

    // ==========================================================
    // Single query: fetch all faculties in one go
    // ==========================================================
    let facultyDocs = [];
    if (facultyIds.size > 0) {
      facultyDocs = await Faculty.find({
        _id: { $in: [...facultyIds] },
      })
        .select("name rank")
        .lean();
    }

    // ==========================================================
    // Build map: facultyId → { name, rank }
    // ==========================================================
    const facultyMap = new Map();
    facultyDocs.forEach((f) => {
      facultyMap.set(f._id.toString(), {
        name: (f.name || "").trim(),
        rank: (f.rank || "").trim(),
      });
    });

    // ==========================================================
    // Helper: resolve faculty display string
    //   - ObjectId → lookup in map → "Name (Rank)" or just "Name"
    //   - String   → as it is
    //   - else     → empty
    // ==========================================================
    function resolveFacultyDisplay(rawFaculty) {
      if (!rawFaculty) return "";

      // String case (e.g. "GUEST FACULTY INMAS")
      if (typeof rawFaculty === "string") {
        return rawFaculty.trim();
      }

      // ObjectId-like case
      if (mongoose.isValidObjectId(rawFaculty)) {
        const key = rawFaculty.toString();
        const entry = facultyMap.get(key);
        if (!entry) return "";

        const { name, rank } = entry;
        if (name && rank) return `${name} (${rank})`;
        return name || "";
      }

      // Object with name (populated doc) — safety net
      if (typeof rawFaculty === "object" && rawFaculty.name) {
        const name = (rawFaculty.name || "").trim();
        const rank = (rawFaculty.rank || "").trim();
        if (name && rank) return `${name} (${rank})`;
        return name;
      }

      return "";
    }

    // ==========================================================
    // PASS 2: Collect THEORY sessions with resolved faculty display
    // ==========================================================
    const rawLectures = [];

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const session of day.sessions) {
          if (session.type !== "THEORY") continue;

          const originalTitle =
            (session.title || "").trim() || "Untitled Lecture";

          rawLectures.push({
            originalTitle,
            normalizedTitle: normalizeTitle(originalTitle),
            facultyDisplay: resolveFacultyDisplay(session.faculty),
          });
        }
      }
    }

    // ==========================================================
    // Group by normalized title + resolved faculty display
    // ==========================================================
    const grouped = new Map();

    for (const lec of rawLectures) {
      const key = `${lec.normalizedTitle.toLowerCase()}||${lec.facultyDisplay.toLowerCase()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          title: lec.normalizedTitle,
          facultyDisplay: lec.facultyDisplay,
          count: 0,
        });
      }
      grouped.get(key).count += 1;
    }

    const lectures = Array.from(grouped.values());

    // ==========================================================
    // Build table
    // ==========================================================
    const totalRows = Math.max(lectures.length, 7);
    const tableBody = [
      [
        { text: "S.No", bold: true, alignment: "center", fontSize: 10 },
        { text: "Topic", bold: true, alignment: "center", fontSize: 10 },
        {
          text: "Name & Rank of Lecturer",
          bold: true,
          alignment: "center",
          fontSize: 10,
        },
        {
          text: "No. of\nLectures",
          bold: true,
          alignment: "center",
          fontSize: 10,
        },
      ],
    ];

    for (let i = 0; i < totalRows; i++) {
      const lec = lectures[i];
      tableBody.push([
        { text: String(i + 1), alignment: "center", fontSize: 10 },
        { text: lec ? lec.title : "", fontSize: 10 },
        { text: lec ? lec.facultyDisplay : "", fontSize: 10 },
        {
          text: lec ? String(lec.count) : "",
          alignment: "center",
          fontSize: 10,
        },
      ]);
    }

    // ==========================================================
    // Signatory names
    // ==========================================================
    const findAuth = (key) =>
      signDoc?.authorities?.find((a) => a.key === key) || {};

    const dyCourseCoord = findAuth("dyCourseCoordinator").name || "";
    const courseCoord = findAuth("courseCoordinator").name || "";
    const courseDirector = findAuth("courseDirector").name || "";
    const adSdc = findAuth("adSdc").name || "";

    // ==========================================================
    // Doc definition
    // ==========================================================
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [45, 35, 45, 40],
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
        lineHeight: 1.3,
      },
      content: [
        // ============ HEADER (logos + title) ============
        {
          columns: [
            {
              width: 75,
              image: LOGO,
              fit: [70, 70],
            },
            {
              width: "*",
              stack: [
                {
                  text: `${courseNumber}${courseOrdinal} ${courseName}`,
                  bold: true,
                  alignment: "center",
                  fontSize: 13,
                },
                {
                  text: `(${startMonthYear} TO ${endMonthYear}) (${durationWeeks} WEEKS)`,
                  alignment: "center",
                  fontSize: 11,
                  margin: [0, 2, 0, 7],
                },
                {
                  text: "SKILL DEVELOPMENT CENTRE (SDC), CFEES",
                  bold: true,
                  alignment: "center",
                  fontSize: 11,
                },
                {
                  text: "DRDO, MINISTRY OF DEFENCE,",
                  bold: true,
                  alignment: "center",
                  fontSize: 11,
                },
                {
                  text: "PILKHUWA, U.P.-245304",
                  bold: true,
                  alignment: "center",
                  fontSize: 11,
                },
              ],
            },
            {
              width: 75,
              image: LOGO,
              fit: [70, 70],
              alignment: "right",
            },
          ],
        },

        // ============ SUBHEADING ============
        {
          text: "Theory Lectures to be Conducted during the Course",
          bold: true,
          decoration: "underline",
          alignment: "center",
          fontSize: 11,
          margin: [0, 20, 0, 12],
        },

        // ============ TABLE ============
        {
          table: {
            headerRows: 1,
            widths: [22, "*", 150, 40],
            body: tableBody,
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
        },

        // ============ SIGNATURES ============
        {
          stack: [
            {
              columns: [
                {
                  text: [
                    `(${signDoc?.authorities?.find((a) => a.key === "deputyCourseCoordinator")?.name || "Sh. Anil Kumar"})\n`,
                    `${signDoc?.authorities?.find((a) => a.key === "deputyCourseCoordinator")?.designation || "TO 'C'"} & Dy. Course Coordinator`,
                  ],
                  alignment: "center",
                  bold: true,
                  fontSize: 9.2,
                },
                {
                  text: [
                    `(${signDoc?.authorities?.find((a) => a.key === "courseCoordinator")?.name || "Rohit Arse"})\n`,
                    `${signDoc?.authorities?.find((a) => a.key === "courseCoordinator")?.designation || "Sc 'C'"} & Course Coordinator`,
                  ],
                  alignment: "center",
                  bold: true,
                  fontSize: 9.2,
                },
                {
                  text: [
                    `(${signDoc?.authorities?.find((a) => a.key === "courseDirector")?.name || "Lavkush Kumar"})\n`,
                    `${signDoc?.authorities?.find((a) => a.key === "courseDirector")?.designation || "Sc 'E'"} & Course Director`,
                  ],
                  alignment: "center",
                  bold: true,
                  fontSize: 9.2,
                },
              ],
            },
            {
              columns: [
                {
                  text: [
                    `(${signDoc?.authorities?.find((a) => a.key === "associateDirector")?.name || "M K Kalra"})\n`,
                    `${signDoc?.authorities?.find((a) => a.key === "associateDirector")?.designation || "Sc 'G'"} & AD (SDC)`,
                  ],
                  alignment: "center",
                  bold: true,
                  fontSize: 9.2,
                },
              ],
              margin: [0, 40, 0, 0],
            },
          ],
          margin: [0, 40, 0, 0],
        },
      ],
    };

    // ==========================================================
    // Render PDF
    // ==========================================================
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const fileName = `Theory Lectures - ${courseNumber} ${courseName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  });
}

module.exports = generateTheoryLectures;
