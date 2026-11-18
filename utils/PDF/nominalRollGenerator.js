// portrait
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

function cell(value) {
  return {
    text: value?.toString() || "",
    alignment: "center",
  };
}

function generateNominalRoll(res, course, applicants) {
  const tableBody = [
    [
      { text: "Roll\nNo.", alignment: "center", bold: true, fontSize: 7 },
      { text: "Personnel\nNo.", alignment: "center", bold: true, fontSize: 7 },
      { text: "Rank", alignment: "center", bold: true, fontSize: 7 },
      { text: "Name", alignment: "center", bold: true, fontSize: 7 },
      { text: "Unit\nAddress", alignment: "center", bold: true, fontSize: 7 },
      { text: "Reporting\nDate", alignment: "center", bold: true, fontSize: 7 },
      { text: "Mobile\nNo.", alignment: "center", bold: true, fontSize: 7 },
      { text: "MO\nNo.", alignment: "center", bold: true, fontSize: 7 },
      { text: "MO\nDate", alignment: "center", bold: true, fontSize: 7 },
      { text: "Sign", alignment: "center", bold: true, fontSize: 7 },
    ],
  ];

  let serial = 1;
  let currentDepartment = "";

  for (const applicant of applicants) {
    if (applicant.applicantId.department !== currentDepartment) {
      currentDepartment = applicant.applicantId.department;
      tableBody.push([
        {
          text: currentDepartment.toUpperCase(),
          colSpan: 10,
          bold: true,
          fillColor: "#d9d9d9",
          alignment: "center",
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ]);
    }

    tableBody.push([
      cell(serial++),
      cell(applicant.applicantId.personnelNumber),
      cell(applicant.applicantId.rank),
      cell(applicant.applicantId.name),
      cell(applicant.applicantId.unitAddress),
      {
        text: [
          {
            text: new Date(applicant.reportingDate).toLocaleDateString("en-IN"),
            alignment: "center",
          },
          {
            text: `\n(${applicant.noonTime === "ForeNoon" ? "FN" : applicant.noonTime === "AfterNoon" ? "AN" : applicant.noonTime})`,
            alignment: "center",
            fontSize: 6.5,
            bold: true,
          },
        ],
        alignment: "center",
      },
      cell(applicant.applicantId.contact),
      cell(applicant.MONumber),
      cell(new Date(applicant.MODate).toLocaleDateString("en-IN")),
      cell(""),
    ]);
  }

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [20, 20, 20, 20],
    defaultStyle: {
      font: "Roboto",
      fontSize: 6.5,
    },
    content: [
      {
        columns: [
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 60,
          },
          {
            width: "*",
            stack: [
              {
                text: `${course.courseNumber}th ${course.courseName}`,
                style: "title",
              },
              {
                text: `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
                style: "date",
              },
              {
                text: "SKILL DEVELOPMENT CENTRE, CFEES",
                style: "heading",
              },
              {
                text: "DRDO, MINISTRY OF DEFENCE",
                alignment: "center",
              },
              {
                text: "PILKHUWA, HAPUR (U.P.)",
                alignment: "center",
              },
              {
                text: "PIN - 245304",
                alignment: "center",
              },
            ],
          },
          {
            image: path.join(__dirname, "../../public/images/cfees-logo.png"),
            width: 60,
          },
        ],
      },
      {
        text: "(NOMINAL ROLL)",
        style: "nominal",
      },
      {
        table: {
          headerRows: 1,
          // Total widths: 18+50+35+75+100+50+40+65+40+55 = 528 points
          widths: [18, 50, 42, 68, 100, 50, 40, 65, 40, 55],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          paddingLeft: () => 1,
          paddingRight: () => 1,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
      },
    ],
    styles: {
      title: {
        fontSize: 16,
        bold: true,
        alignment: "center",
      },
      date: {
        fontSize: 11,
        alignment: "center",
        margin: [0, 5, 0, 8],
      },
      heading: {
        fontSize: 13,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 4],
      },
      nominal: {
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 15, 0, 15],
      },
    },
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  res.setHeader("Content-Type", "application/pdf");
  const fileName = `NominalRoll - ${course.courseNumber}th ${course.courseName}.pdf`;
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  pdfDoc.pipe(res);
  pdfDoc.end();
}

module.exports = generateNominalRoll;

// portrait
// const PdfPrinter = require("pdfmake");
// const path = require("path");

// const fonts = {
//   Roboto: {
//     normal: path.join(__dirname, "../../fonts/Roboto-Regular.ttf"),
//     bold: path.join(__dirname, "../../fonts/Roboto-Bold.ttf"),
//     italics: path.join(__dirname, "../../fonts/Roboto-Italic.ttf"),
//     bolditalics: path.join(__dirname, "../../fonts/Roboto-Medium.ttf"),
//   },
// };

// const printer = new PdfPrinter(fonts);

// function cell(value) {
//   return {
//     text: value?.toString() || "",
//     alignment: "center",
//   };
// }

// function generateNominalRoll(res, course, applicants) {
//   const tableBody = [
//     [
//       { text: "Roll\nNo.", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Personnel\nNo.", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Rank", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Name", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Unit\nAddress", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Reporting\nDate", alignment: "center", bold: true, fontSize: 7 },
//       { text: "FN /\nAN", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Mobile\nNo.", alignment: "center", bold: true, fontSize: 7 },
//       { text: "MO\nNo.", alignment: "center", bold: true, fontSize: 7 },
//       { text: "MO\nDate", alignment: "center", bold: true, fontSize: 7 },
//       { text: "Sign", alignment: "center", bold: true, fontSize: 7 },
//     ],
//   ];

//   let serial = 1;
//   let currentDepartment = "";

//   for (const applicant of applicants) {
//     // 👇 Yahan .applicantId.department use kiya
//     if (applicant.applicantId.department !== currentDepartment) {
//       currentDepartment = applicant.applicantId.department;
//       tableBody.push([
//         {
//           text: currentDepartment.toUpperCase(),
//           colSpan: 11,
//           bold: true,
//           fillColor: "#d9d9d9",
//           alignment: "center",
//         },
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//       ]);
//     }

//     tableBody.push([
//       cell(serial++),
//       cell(applicant.applicantId.personnelNumber), // 👈 Fix
//       cell(applicant.applicantId.rank), // 👈 Fix
//       cell(applicant.applicantId.name), // 👈 Fix
//       cell(applicant.applicantId.unitAddress), // 👈 Fix
//       cell(new Date(applicant.reportingDate).toLocaleDateString("en-IN")),
//       cell(
//         applicant.noonTime === "ForeNoon"
//           ? "FN"
//           : applicant.noonTime === "AfterNoon"
//             ? "AN"
//             : applicant.noonTime,
//       ),
//       cell(applicant.applicantId.contact), // 👈 Fix
//       cell(applicant.MONumber),
//       cell(new Date(applicant.MODate).toLocaleDateString("en-IN")),
//       cell(""),
//     ]);
//   }

//   const docDefinition = {
//     pageSize: "A4",
//     pageMargins: [30, 30, 30, 30],
//     defaultStyle: {
//       font: "Roboto",
//       fontSize: 6.5,
//     },
//     content: [
//       {
//         columns: [
//           {
//             image: path.join(__dirname, "../../public/images/cfees-logo.png"),
//             width: 60,
//           },
//           {
//             width: "*",
//             stack: [
//               {
//                 text: `${course.courseNumber}th ${course.courseName}`,
//                 style: "title",
//               },
//               {
//                 text: `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
//                 style: "date",
//               },
//               {
//                 text: "SKILL DEVELOPMENT CENTRE, CFEES",
//                 style: "heading",
//               },
//               {
//                 text: "DRDO, MINISTRY OF DEFENCE",
//                 alignment: "center",
//               },
//               {
//                 text: "PILKHUWA, HAPUR (U.P.)",
//                 alignment: "center",
//               },
//               {
//                 text: "PIN - 245304",
//                 alignment: "center",
//               },
//             ],
//           },
//           {
//             image: path.join(__dirname, "../../public/images/cfees-logo.png"),
//             width: 60,
//           },
//         ],
//       },
//       {
//         text: "(NOMINAL ROLL)",
//         style: "nominal",
//       },
//       {
//         table: {
//           headerRows: 1,
//           widths: [18, 55, 55, 65, 78, 34, 24, 58, 48, 36, 32],
//           body: tableBody,
//         },
//         layout: {
//           hLineWidth: () => 1,
//           vLineWidth: () => 1,
//           paddingLeft: () => 1,
//           paddingRight: () => 1,
//           paddingTop: () => 3,
//           paddingBottom: () => 3,
//         },
//       },
//     ],
//     styles: {
//       title: {
//         fontSize: 16,
//         bold: true,
//         alignment: "center",
//       },
//       date: {
//         fontSize: 11,
//         alignment: "center",
//         margin: [0, 5, 0, 8],
//       },
//       heading: {
//         fontSize: 13,
//         bold: true,
//         alignment: "center",
//         margin: [0, 0, 0, 4],
//       },
//       nominal: {
//         fontSize: 14,
//         bold: true,
//         alignment: "center",
//         margin: [0, 15, 0, 15],
//       },
//     },
//   };

//   const pdfDoc = printer.createPdfKitDocument(docDefinition);
//   res.setHeader("Content-Type", "application/pdf");
//   const fileName = `NominalRoll - ${course.courseNumber}th ${course.courseName}.pdf`;
//   res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//   pdfDoc.pipe(res);
//   pdfDoc.end();
// }

// module.exports = generateNominalRoll;

// Landscape orientation
// const PdfPrinter = require("pdfmake");
// const path = require("path");

// const fonts = {
//   Roboto: {
//     normal: path.join(__dirname, "../../fonts/Roboto-Regular.ttf"),
//     bold: path.join(__dirname, "../../fonts/Roboto-Bold.ttf"),
//     italics: path.join(__dirname, "../../fonts/Roboto-Italic.ttf"),
//     bolditalics: path.join(__dirname, "../../fonts/Roboto-Medium.ttf"),
//   },
// };

// const printer = new PdfPrinter(fonts);

// function cell(value) {
//   return {
//     text: value?.toString() || "",
//     alignment: "center",
//     fontSize: 8,
//   };
// }

// function generateNominalRoll(res, course, applicants) {
//   const tableBody = [
//     [
//       { text: "Roll\nNo.", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Personnel\nNo.", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Rank", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Name", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Unit\nAddress", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Reporting\nDate", alignment: "center", bold: true, fontSize: 8 },
//       { text: "FN /\nAN", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Mobile\nNo.", alignment: "center", bold: true, fontSize: 8 },
//       { text: "MO\nNo.", alignment: "center", bold: true, fontSize: 8 },
//       { text: "MO\nDate", alignment: "center", bold: true, fontSize: 8 },
//       { text: "Sign", alignment: "center", bold: true, fontSize: 8 },
//     ],
//   ];

//   let serial = 1;
//   let currentDepartment = "";
//   for (const applicant of applicants) {
//     if (applicant.applicantId.department !== currentDepartment) {
//       currentDepartment = applicant.applicantId.department;
//       tableBody.push([
//         {
//           text: currentDepartment.toUpperCase(),
//           colSpan: 11,
//           bold: true,
//           fillColor: "#d9d9d9",
//           alignment: "center",
//         },
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//         {},
//       ]);
//     }

//     tableBody.push([
//       cell(serial++),
//       cell(applicant.applicantId.personnelNumber),
//       cell(applicant.applicantId.rank),
//       cell(applicant.applicantId.name),
//       cell(applicant.applicantId.unitAddress),
//       cell(new Date(applicant.reportingDate).toLocaleDateString("en-IN")),
//       cell(
//         applicant.noonTime === "ForeNoon"
//           ? "FN"
//           : applicant.noonTime === "AfterNoon"
//             ? "AN"
//             : applicant.noonTime,
//       ),
//       cell(applicant.applicantId.contact),
//       cell(applicant.MONumber),
//       cell(new Date(applicant.MODate).toLocaleDateString("en-IN")),
//       cell(""),
//     ]);
//   }

//   const docDefinition = {
//     pageSize: "A4",
//     pageOrientation: "landscape",
//     pageMargins: [30, 30, 30, 30],
//     defaultStyle: {
//       font: "Roboto",
//       fontSize: 8,
//     },
//     content: [
//       {
//         columns: [
//           {
//             image: path.join(__dirname, "../../public/images/cfees-logo.png"),
//             width: 70,
//           },
//           {
//             width: "*",
//             stack: [
//               {
//                 text: [
//                   `${course.courseNumber}`,
//                   {
//                     text: course.ordinal,
//                     sup: true,
//                     fontSize: 11,
//                   },
//                   ` ${course.courseName}`,
//                 ],
//                 style: "title",
//               },
//               {
//                 text: `(${new Date(course.startDate).toLocaleDateString("en-GB")} to ${new Date(course.endDate).toLocaleDateString("en-GB")})`,
//                 style: "date",
//               },
//               {
//                 text: "SKILL DEVELOPMENT CENTRE, CFEES",
//                 style: "heading",
//               },
//               {
//                 text: "DRDO, MINISTRY OF DEFENCE",
//                 alignment: "center",
//               },
//               {
//                 text: "PILKHUWA, HAPUR (U.P.)",
//                 alignment: "center",
//               },
//               {
//                 text: "PIN - 245304",
//                 alignment: "center",
//               },
//             ],
//           },
//           {
//             image: path.join(__dirname, "../../public/images/cfees-logo.png"),
//             width: 70,
//           },
//         ],
//       },
//       {
//         text: "(NOMINAL ROLL)",
//         style: "nominal",
//       },
//       {
//         table: {
//           headerRows: 1,
//           widths: [
//             "auto",
//             "*",
//             "*",
//             "*",
//             "*",
//             "auto",
//             "auto",
//             "*",
//             "*",
//             "auto",
//             40,
//           ],
//           body: tableBody,
//         },
//         layout: {
//           hLineWidth: () => 1,
//           vLineWidth: () => 1,
//           paddingLeft: () => 2,
//           paddingRight: () => 2,
//           paddingTop: () => 4,
//           paddingBottom: () => 7,
//         },
//       },
//     ],
//     styles: {
//       title: {
//         fontSize: 20,
//         bold: true,
//         alignment: "center",
//       },
//       date: {
//         fontSize: 12,
//         alignment: "center",
//         margin: [0, 5, 0, 8],
//       },
//       heading: {
//         fontSize: 16,
//         bold: true,
//         alignment: "center",
//         margin: [0, 0, 0, 4],
//       },
//       nominal: {
//         fontSize: 18,
//         bold: true,
//         alignment: "center",
//         margin: [0, 18, 0, 18],
//       },
//     },
//   };

//   const pdfDoc = printer.createPdfKitDocument(docDefinition);
//   res.setHeader("Content-Type", "application/pdf");
//   const fileName = `NominalRoll - ${course.courseNumber}th ${course.courseName}.pdf`;
//   res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//   pdfDoc.pipe(res);
//   pdfDoc.end();
// }

// module.exports = generateNominalRoll;
