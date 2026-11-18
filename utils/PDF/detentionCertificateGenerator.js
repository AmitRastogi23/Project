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

function generateDetentionCertificates(
  res,
  course,
  applicants,
  signDoc,
  inline = false,
) {
  const content = [];
  const courseShortName = getCourseShortName(course.courseName);

  applicants.forEach((applicant, index) => {
    const SOSDate = applicant.SOS || course.endDate;
    const SOSReason = applicant.SOSReason
      ? applicant.SOSReason.toLowerCase()
      : "completion of the course";

    const leaveDates = applicant.leaves || [];
    let leaveText = "";
    if (leaveDates.length === 0) {
      leaveText = "He has been granted 0 day(s) leave during the course.";
    } else {
      const formattedDates = leaveDates.map((date) =>
        new Date(date).toLocaleDateString("en-IN"),
      );
      let datesText;
      if (formattedDates.length === 1) {
        datesText = formattedDates[0];
      } else if (formattedDates.length === 2) {
        datesText = `${formattedDates[0]} and ${formattedDates[1]}`;
      } else {
        datesText =
          `${formattedDates.slice(0, -1).join(", ")} and ` +
          formattedDates[formattedDates.length - 1];
      }
      leaveText = `He has been granted ${applicant.totalLeaves} day(s) leave on ${datesText} during the course.`;
    }

    content.push(
      {
        columns: [
          {
            width: "40%",
            columns: [
              {
                width: 45,
                text: "Phone :\nFax :",
              },
              {
                width: "*",
                text: "09266158842\n01123819547\n01123819401",
              },
            ],
            fontSize: 10,
          },
          {
            width: "20%",
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            fit: [80, 80],
            alignment: "center",
          },
          {
            width: "40%",
            text: [
              `No. CFEES/SDC/Training/${course.year.year}/${course.courseNumber}`,
              {
                text: course.ordinal,
                sup: true,
                fontSize: 7,
              },
              `${courseShortName}\n`,
              "Govt. of India, Ministry of Defence\n",
              "Centre for Fire, Explosive &\n",
              "Environment Safety (CFEES)\n",
              "Skill Development Centre\n",
              "Pilkhuwa, Hapur (U.P.) - 245304\n",
              { text: "Dated : ", bold: true },
              "__________",
            ],
            fontSize: 10,
            alignment: "left",
          },
        ],
      },
      {
        text: `\n${applicant.applicantId.unitAddress}`,
        bold: true,
        fontSize: 11,
        alignment: "left",
        margin: [0, 15, 0, 20],
      },
      {
        text: "\nDETENTION CERTIFICATE",
        bold: true,
        fontSize: 18,
        decoration: "underline",
        alignment: "center",
      },
      {
        text: [
          "\nSUBJECT : ",
          `${course.courseNumber}`,
          {
            text: course.ordinal,
            sup: true,
            fontSize: 8,
          },
          ` ${course.courseName.toUpperCase()}`,
        ],
        bold: true,
        decoration: "underline",
        fontSize: 14,
      },
      {
        columns: [
          {
            width: 360,
            text: [
              { text: "Ref : Your Signal / Movement Order No. ", bold: true },
              { text: applicant.MONumber },
            ],
          },
          {
            width: 140,
            text: [
              { text: "Dated : ", bold: true },
              { text: new Date(applicant.MODate).toLocaleDateString("en-IN") },
            ],
          },
        ],
        fontSize: 11,
        margin: [0, 10, 0, 10],
      },
      {
        columns: [
          {
            width: 165,
            text: [
              { text: "Personnel No. : ", bold: true },
              applicant.applicantId.personnelNumber,
            ],
          },
          {
            width: 135,
            text: [{ text: "Rank : ", bold: true }, applicant.applicantId.rank],
          },
          {
            width: "*",
            text: [{ text: "Name : ", bold: true }, applicant.applicantId.name],
          },
        ],
        fontSize: 11,
        margin: [0, 0, 0, 10],
      },
      {
        ol: [
          {
            text: `Reported on ${new Date(applicant.reportingDate).toLocaleDateString("en-IN")} (${applicant.noonTime === "ForeNoon" ? "FN" : "AN"}) to attend the above mentioned course from ${new Date(course.startDate).toLocaleDateString("en-IN")} to ${new Date(course.endDate).toLocaleDateString("en-IN")}.`,
            margin: [0, 0, 0, 6],
          },
          {
            text: `He is being sent back to the unit on ${SOSReason} & will be SOS w.e.f ${new Date(SOSDate).toLocaleDateString("en-IN")} (${applicant.noonTime === "ForeNoon" ? "FN" : "AN"}). ${leaveText}`,
            margin: [0, 0, 0, 6],
          },
          {
            text: "No Transport was provided to the individual from railway station/airport to SDC and back. No TA/DA was paid to him by this centre.",
            margin: [0, 0, 0, 6],
          },
          {
            text: "No free fooding and accommodation was provided to him during the stay.",
            margin: [0, 0, 0, 6],
          },
        ],
        fontSize: 12,
        lineHeight: 1.45,
        margin: [0, 0, 0, 10],
      },
      {
        text: [
          {
            text: `(${signDoc.authorities.find((authority) => authority.key === "courseDirector")?.name || "Lavkush Kumar"})\n`,
            bold: true,
          },
          {
            text: `${signDoc?.authorities?.find((authority) => authority.key === "courseDirector")?.designation || "Scientist 'E'"} & OIC-SDC\n`,
          },
          { text: "For Director" },
        ],
        alignment: "right",
        margin: [0, 30, 0, 0],
      },
      {
        text: `\nCopy to:
            1. Individual Copy
            2. Office Copy`,
      },
    );

    if (index !== applicants.length - 1) {
      content.push({
        text: "",
        pageBreak: "after",
      });
    }
  });

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 35, 40, 35],
    defaultStyle: {
      font: "Roboto",
      fontSize: 12,
    },
    content: content,
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  if (inline) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Detention Certificates - ${course.courseNumber} ${course.courseName}.pdf"`,
    );
  } else {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Detention Certificates - ${course.courseNumber} ${course.courseName}.pdf"`,
    );
  }

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateDetentionCertificates;
