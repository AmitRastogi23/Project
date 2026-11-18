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

function generateClearanceCertificate(
  res,
  course,
  applicants,
  signDoc,
  inline = false,
) {
  const tableBody = [
    [
      {
        text: "S.\nNO.",
        bold: true,
        alignment: "center",
        fontSize: 8,
      },
      {
        text: "PERSONNEL\nNUMBER",
        bold: true,
        alignment: "center",
        fontSize: 8,
      },
      {
        text: "RANK",
        bold: true,
        alignment: "center",
        fontSize: 8,
      },
      {
        text: "NAME",
        bold: true,
        alignment: "center",
        fontSize: 8,
      },
      {
        text: "SIGNATURE",
        bold: true,
        alignment: "center",
        fontSize: 8,
      },
    ],
  ];

  applicants.forEach((applicant, index) => {
    tableBody.push([
      {
        text: String(index + 1),
        alignment: "center",
        fontSize: 8,
      },
      {
        text: applicant.applicantId.personnelNumber || "",
        alignment: "center",
        fontSize: 8,
      },
      {
        text: applicant.applicantId.rank || "",
        alignment: "center",
        fontSize: 8,
      },
      {
        text: applicant.applicantId.name || "",
        alignment: "center",
        fontSize: 8,
      },
      {
        text: "",
        alignment: "center",
        fontSize: 8,
      },
    ]);
  });

  // ===== PDF DEFINITION =====
  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [35, 30, 35, 30],

    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
    },

    content: [
      // ----- HEADER -----
      {
        columns: [
          {
            width: 65,
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            alignment: "left",
          },
          {
            width: "*",
            stack: [
              {
                text: "SKILL DEVELOPMENT CENTRE, CFEES",
                bold: true,
                alignment: "center",
                fontSize: 12,
              },
              {
                text: "DRDO, MINISTRY OF DEFENCE",
                bold: true,
                alignment: "center",
                fontSize: 10,
                margin: [0, 1, 0, 0],
              },
              {
                text: "PILKHUWA, HAPUR (U.P.)",
                bold: true,
                alignment: "center",
                fontSize: 10,
                margin: [0, 1, 0, 0],
              },
            ],
          },
          {
            width: 65,
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            alignment: "right",
          },
        ],
        columnGap: 8,
      },

      // ----- TITLE -----
      {
        text: "CLEARANCE CERTIFICATE: NO DUES",
        alignment: "center",
        bold: true,
        fontSize: 13,
        decoration: "underline",
        margin: [0, 2, 0, 0],
      },

      // ----- DESCRIPTION -----
      {
        text: [
          "This is to certify that below mentioned candidates bearing IDs of their respective organization have participated in the ",
          {
            text: [
              `${course.courseNumber}`,
              {
                text: course.ordinal,
                sup: true,
                fontSize: 5,
              },
              ` ${course.courseName}`,
            ],
            bold: true,
            italics: true,
          },
          " held from ",
          {
            text: new Date(course.startDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            bold: true,
            italics: true,
          },
          " to ",
          {
            text: new Date(course.endDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
            bold: true,
            italics: true,
          },
          " at SDC.",
        ],
        alignment: "left",
        fontSize: 9,
        lineHeight: 1.2,
        margin: [3, 10, 3, 10],
      },

      // ----- MAIN TABLE -----
      {
        table: {
          headerRows: 1,
          widths: [28, 105, 85, "*", 105],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },

      // ----- CONFIRMATION TEXT -----
      {
        text: "We hereby confirm that above mentioned participants have cleared all the pending dues and have returned all the belongings of the SDC, CFEES that was provided to them during their tenure with SDC, CFEES. They have no pending obligations or liabilities left towards the SDC, CFEES. We wish them all the best for their future endeavor.",
        fontSize: 9,
        lineHeight: 1.2,
        margin: [0, 14, 0, 10],
      },

      // ----- DUES TABLE (with pageBreak: "avoid") -----
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              {
                text: "Department / Office",
                bold: true,
                alignment: "center",
                fontSize: 8,
              },
              {
                text: "Dues/No-Dues",
                bold: true,
                alignment: "center",
                fontSize: 8,
              },
              {
                text: "Signature",
                bold: true,
                alignment: "center",
                fontSize: 8,
              },
            ],
            [{ text: "Library", fontSize: 8 }, "", ""],
            [{ text: "Hostel", fontSize: 8 }, "", ""],
            [{ text: "Training JCO", fontSize: 8 }, "", ""],
            [{ text: "Fire Station", fontSize: 8 }, "", ""],
            [{ text: "Registration", fontSize: 8 }, "", ""],
          ],
        },
        layout: {
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.4,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 18],
        pageBreak: "avoid", // 🔥 YAHI FIX HAI - TABLE PAGE BREAK NAHI KAREGI
      },

      // ----- SIGNATURE -----
      {
        text: [
          {
            text: `(${signDoc?.authorities?.find((authority) => authority.key === "courseDirector")?.name || "Lavkush Kumar"})\n`,
            bold: true,
            fontSize: 10,
          },
          { text: "Course Director\n", fontSize: 10 },
          { text: "& OIC - SDC", bold: true, fontSize: 10 },
        ],
        alignment: "right",
        margin: [0, 0, 20, 0],
      },
    ],
  };

  // ===== PDF GENERATION =====
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  if (inline) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Clearance Certificates - ${course.courseNumber} ${course.courseName}.pdf"`,
    );
  } else {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Clearance Certificates - ${course.courseNumber} ${course.courseName}.pdf"`,
    );
  }

  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateClearanceCertificate;
