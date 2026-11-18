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

// "12 Jan 2026" format
function formatDateShort(date) {
  if (!date) return "____________";
  const d = new Date(date);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "IST" });
  const yyyy = d.getUTCFullYear();
  return `${dd} ${month} ${yyyy}`;
}

// "1000 hrs"
function formatTime(t) {
  if (!t) return "";
  return t.replace(":", "") + " hrs";
}

// "________ Jan 2026"
function formatDatedBlank(date) {
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  return `    ${month} ${year}`;
}

// lecture date se 1 din pehle, "12 Jan 2026"
function formatDayBefore(date) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const yyyy = d.getUTCFullYear();
  return `${dd} ${month} ${yyyy}`;
}

function generateGuestFacultyInvite(res, course, lecture, address, signDoc) {
  const courseShortName = getCourseShortName(course.courseName);

  const courseDirectorAuthority = signDoc?.authorities?.find(
    (a) => a.key === "courseDirector",
  );
  const signatoryName = courseDirectorAuthority?.name || "Lavkush Kumar";

  const submitDate = formatDayBefore(lecture.date);

  const content = [
    {
      columns: [
        {
          width: "35%",
          stack: [
            {
              columns: [
                { width: 50, text: "Phone :\nFax      :", fontSize: 10 },
                {
                  width: "*",
                  text: "09266158842\n23819547\n23819401",
                  fontSize: 10,
                },
              ],
            },
            {
              text: "\nAll correspondence to be\naddressed to\nDirector CFEES.",
              fontSize: 10,
              bold: true,
            },
          ],
        },
        {
          width: "25%",
          image: path.join(__dirname, "../../public/images/cfees-logo.png"),
          fit: [80, 80],
          alignment: "center",
        },
        {
          width: "40%",
          stack: [
            { text: "Government of India,", fontSize: 10 },
            { text: "Ministry of Defence", fontSize: 10 },
            { text: "Centre for Fire, Explosive &", fontSize: 10 },
            { text: "Environment Safety (CFEES)", fontSize: 10 },
            { text: "Skill Development Centre (SDC)", fontSize: 10 },
            { text: "Pilkhuwa U.P, 245304", fontSize: 10 },
          ],
          alignment: "left",
        },
      ],
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
            `${courseShortName}\n`,
          ],
          fontSize: 11,
          bold: true,
          margin: [0, 20, 0, 0],
        },
        {
          text: `Dated: ${formatDatedBlank(lecture.date)}`,
          fontSize: 11,
          alignment: "left",
          margin: [80, 20, 0, 0],
        },
      ],
    },

    {
      text: address || "",
      fontSize: 11,
      margin: [0, 20, 0, 15],
    },

    {
      text: [
        'SUBJECT:- REQUEST FOR GUEST FACULTY FOR "',
        { text: `${course.courseNumber}${course.ordinal} `, bold: true },
        { text: course.courseName.toUpperCase(), italics: true },
        '" AT SKILL DEVELOPMENT CENTRE, PILKHUWA.',
      ],
      bold: true,
      fontSize: 11,
      alignment: "left",
      margin: [15, 10, 0, 15],
    },

    // ================= Para 1 + 2 =================
    {
      ol: [
        {
          text: `DRDO Skill Development Centre, Pilkhuwa, is a premier training and testing institute of CFEES, DRDO to impart high standard of professional training to the personnel of Defence and of various Government Organizations. This is to inform you that the Centre conducts various specialized courses on Fire Safety and Fire Fighting. The centre is presently conducting "${course.courseNumber}${course.ordinal} ${course.courseName}" scheduled from ${formatDateShort(course.startDate)} to ${formatDateShort(course.endDate)}.`,
          margin: [15, 0, 0, 8],
        },
        {
          text: "This is to request you to detail a suitable Officer for delivering lecture as per schedule mentioned below:",
          margin: [15, 0, 0, 8],
        },
      ],
      fontSize: 11,
      lineHeight: 1.35,
    },

    // ================= TABLE =================
    {
      margin: [25, 0, 0, 12],
      table: {
        widths: [40, "*", "*"],
        headerRows: 1,
        body: [
          [
            { text: "S.No.", bold: true, alignment: "center" },
            { text: "Time & Date", bold: true, alignment: "center" },
            { text: "Subject", bold: true, alignment: "center" },
          ],
          [
            { text: "1.", alignment: "center" },
            {
              text: `${formatDateShort(lecture.date)} : ${formatTime(lecture.startTime)} to ${formatTime(lecture.endTime)}`,
              alignment: "center",
            },
            {
              text:
                lecture.title && lecture.title !== "—" ? lecture.title : "—",
              alignment: "center",
            },
          ],
        ],
      },
      fontSize: 11,
    },

    // ================= Points 3-6 =================
    {
      ol: [
        {
          text: "Honorarium as Govt. Rules will be paid to the faculty deputed for lecture.",
          margin: [15, 0, 0, 6],
        },
        {
          text: [
            "The deputed officers are request to send their brief bio-data, copy of PAN Card, copy of cancelled cheque and presentation on the relevant subject to email ID: ",
            { text: "oicsdcpkw.cfees@gov.in", bold: true },
            ` by ${submitDate}.`,
          ],
          margin: [15, 0, 0, 6],
        },
        {
          text: [
            "It is also requested to kindly send ten multiple choice questions with answers for the awareness test of the participants to email ID: ",
            { text: "oicsdcpkw.cfees@gov.in", bold: true },
            ` by ${submitDate}.`,
          ],
          margin: [15, 0, 0, 6],
        },
        {
          text: "A line of confirmation in this regard is solicited from your end.",
          margin: [15, 0, 0, 6],
        },
      ],
      start: 3,
      fontSize: 11,
      lineHeight: 1.35,
    },

    // ================= Sign-off =================
    {
      stack: [
        { text: "(" + signatoryName + ")", bold: true },
        { text: "Course Director & OIC SDC" },
        { text: "For Director" },
      ],
      alignment: "right",
      fontSize: 11,
      margin: [0, 30, 0, 0],
    },
  ];

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [50, 40, 50, 40],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
    },
    content: content,
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Guest Faculty Invite - ${course.courseNumber} - ${lecture.faculty}.pdf"`,
  );

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateGuestFacultyInvite;
