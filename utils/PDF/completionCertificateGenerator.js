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

function generateCompletionCertificate(
  res,
  course,
  applicants,
  signDoc,
  inline = false,
) {
  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [35, 35, 35, 35],
    defaultStyle: {
      font: "Roboto",
      fontSize: 13,
    },
    background: function () {
      return {
        canvas: [
          {
            type: "rect",
            x: 20,
            y: 20,
            w: 800,
            h: 550,
            lineWidth: 2,
          },
          {
            type: "rect",
            x: 28,
            y: 28,
            w: 784,
            h: 534,
            lineWidth: 1,
          },
        ],
      };
    },
    content: applicants
      .map((applicant, index) => [
        {
          columns: [
            {
              width: "*",
              text: `NO. ISO/TG/${course.courseNumber}`,
              margin: [10, 15, 0, 0],
              fontSize: 13,
            },
            {
              width: 80,
              image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            },
            {
              width: "*",
              text: [
                `COURSE NO. ${course.courseNumber}`,
                {
                  text: course.ordinal,
                  sup: true,
                  fontSize: 9,
                },
              ],
              alignment: "right",
              margin: [0, 15, 10, 0],
              fontSize: 13,
            },
          ],
        },
        {
          text: "Skill Development Centre (SDC), Pilkhuwa (U.P.)",
          alignment: "center",
          margin: [0, 8, 0, 3],
          fontSize: 18,
        },
        {
          text: "Centre for Fire, Explosive & Environment Safety (CFEES), Delhi - 110054",
          alignment: "center",
          margin: [0, 0, 0, 3],
          fontSize: 16,
        },
        {
          text: "(An ISO 9001: 2015 Centre)",
          alignment: "center",
          margin: [0, 0, 0, 3],
          fontSize: 13,
        },
        {
          text: "Defence R&D Organisation (DRDO), Ministry of Defence, Govt. of India",
          alignment: "center",
          margin: [0, 0, 0, 12],
          fontSize: 16,
        },
        {
          text: "CERTIFICATE",
          alignment: "center",
          bold: true,
          fontSize: 24,
          margin: [0, 0, 0, 7],
          decoration: "underline",
        },
        {
          text: "It is certified that",
          italics: true,
          alignment: "center",
          margin: [0, 0, 0, 20],
          fontSize: 16,
        },
        {
          text: [
            { text: "Personnel No. : ", bold: true },
            applicant.applicantId.personnelNumber,
            "     ",
            { text: "Rank : ", bold: true },
            applicant.applicantId.rank,
            "     ",
            { text: "Name : ", bold: true },
            applicant.applicantId.name,
          ],
          alignment: "center",
          fontSize: 15,
          margin: [0, 0, 0, 8],
        },
        {
          text: [
            { text: "Unit Address : ", bold: true },
            applicant.applicantId.unitAddress,
          ],
          alignment: "center",
          fontSize: 15,
          margin: [0, 0, 0, 6],
        },
        {
          stack: [
            {
              text: "has successfully passed the",
              alignment: "center",
            },
            {
              text: [
                `${course.courseNumber}`,
                {
                  text: course.ordinal,
                  sup: true,
                  fontSize: 8,
                },
                ` ${course.courseName.toUpperCase()}`,
              ],
              alignment: "center",
              bold: true,
              decoration: "underline",
            },
            {
              text: [
                "conducted from ",
                {
                  text: new Date(course.startDate).toLocaleDateString("en-GB"),
                  bold: true,
                  decoration: "underline",
                },
                " to ",
                {
                  text: new Date(course.endDate).toLocaleDateString("en-GB"),
                  bold: true,
                  decoration: "underline",
                },
                " at the centre and is",
              ],
              alignment: "center",
            },
            {
              text: "placed in __________ Grading.",
              alignment: "center",
            },
          ],
          fontSize: 15,
          margin: [0, 0, 0, 10],
        },
        {
          text: "",
          margin: [0, 55, 0, 0],
        },
        {
          columns: [
            {
              width: "33%",
              stack: [
                {
                  text: (
                    signDoc?.authorities?.find(
                      (authority) => authority.key === "courseDirector",
                    )?.name || "LAVKUSH KUMAR"
                  ).toUpperCase(),
                  bold: true,
                  alignment: "center",
                },
                {
                  text: `${
                    signDoc?.authorities?.find(
                      (authority) => authority.key === "courseDirector",
                    )?.designation || "Sc 'E'"
                  } & OIC-SDC`,
                  alignment: "center",
                },
                {
                  text: "Course Director",
                  alignment: "center",
                },
              ],
            },
            {
              width: "34%",
              stack: [
                {
                  text: (
                    signDoc?.authorities?.find(
                      (authority) => authority.key === "associateDirector",
                    )?.name || "Dr. M K KALRA"
                  ).toUpperCase(),
                  bold: true,
                  alignment: "center",
                },
                {
                  text: `${
                    signDoc?.authorities?.find(
                      (authority) => authority.key === "associateDirector",
                    )?.designation || "Sc 'G'"
                  } & Assoc. Director`,
                  alignment: "center",
                },
                {
                  text: "SDC Pilkhuwa",
                  alignment: "center",
                },
              ],
            },
            {
              width: "33%",
              stack: [
                {
                  text: (
                    signDoc?.authorities?.find(
                      (authority) => authority.key === "director",
                    )?.name || "ARVIND KUMAR"
                  ).toUpperCase(),
                  bold: true,
                  alignment: "center",
                },
                {
                  text: `${
                    signDoc?.authorities?.find(
                      (authority) => authority.key === "director",
                    )?.designation || "OS"
                  } & Director CFEES`,
                  alignment: "center",
                },
              ],
            },
          ],
        },
        ...(index < applicants.length - 1
          ? [
              {
                text: "",
                pageBreak: "after",
              },
            ]
          : []),
      ])
      .flat(),
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  // INLINE = browser preview, false = direct download
  if (inline) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Completion Certificates - ${course.courseNumber} ${course.courseName}.pdf"`,
    );
  } else {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Completion Certificates - ${course.courseNumber} ${course.courseName}.pdf"`,
    );
  }

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateCompletionCertificate;
