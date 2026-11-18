const PdfPrinter = require("pdfmake");

function prepareScheduleData(schedule) {
  if (!schedule || !Array.isArray(schedule.weeks)) {
    return [];
  }

  return schedule.weeks.map((week) => {
    return {
      weekNumber: week.weekNumber,
      startDate: week.startDate,
      endDate: week.endDate,

      docSupport1: week.docSupport1 || "",
      docSupport2: week.docSupport2 || "",

      days: (week.days || []).map((day) => {
        return {
          date: day.date,
          day: day.day,

          sessions: (day.sessions || []).map((session) => {
            return {
              id: session._id,

              startTime: session.startTime,
              endTime: session.endTime,

              type: session.type,
              title: session.title || "",

              faculty: session.faculty || null,
              location: session.location || "",
            };
          }),
        };
      }),
    };
  });
}

function getSessionDisplayTitle(session) {
  if (!session) return "";

  let title = "";

  switch (session.type) {
    case "MID_TERM":
      title = "MID-TERM PRACTICAL & THEORY EXAMINATION";
      break;

    case "FINAL_TERM":
      title = "FINAL-TERM PRACTICAL & THEORY EXAMINATION";
      break;

    case "INSTRUCTIONAL_VISIT":
      title = `INSTRUCTIONAL VISIT : ${session.location || ""}`;
      break;

    case "VALEDICTORY_FUNCTION":
      title = "Valedictory Function";
      break;

    default:
      title = session.title || "";
  }

  // 👇 Faculty name safe nikal
  if (["THEORY", "PRACTICAL"].includes(session.type) && session.faculty) {
    let facultyName = "";

    if (typeof session.faculty === "string") {
      // Guest Faculty case
      facultyName = session.faculty;
    } else if (session.faculty && session.faculty.name) {
      // Populated ObjectId case
      facultyName = session.faculty.name;
    }

    if (facultyName) {
      title += `\n(${facultyName})`;
    }
  }

  return title;
}

function isRotatableSession(session) {
  if (!session) {
    return false;
  }

  const rotatableTypes = [
    "SQUAD_DRILL",
    "ROLL_CALL",
    "BREAK",
    "LUNCH",
    "MAINTENANCE",
    "GAMES",
  ];

  return rotatableTypes.includes(session.type);
}

function timeToMinutes(time) {
  if (!time || typeof time !== "string") {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function getDateKey(date) {
  const d = new Date(date);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function findHoliday(day, holidays) {
  if (!day || !day.date || !Array.isArray(holidays)) {
    return null;
  }

  const key = getDateKey(day.date);

  return holidays.find((holiday) => getDateKey(holiday.date) === key);
}

function buildWeekPeriods(week) {
  const timePoints = new Set();

  const fixedTimePoints = [
    "06:30",
    "07:30",
    "08:40",
    "09:00",
    "09:45",
    "10:30",
    "11:45",
    "12:30",
    "13:15",
    "14:15",
    "15:00",
    "15:30",
    "16:15",
    "17:00",
    "18:00",
    "21:00",
    "21:15",
  ];

  for (const time of fixedTimePoints) {
    timePoints.add(time);
  }

  for (const day of week.days || []) {
    for (const session of day.sessions || []) {
      if (session.startTime) {
        timePoints.add(session.startTime);
      }

      if (session.endTime) {
        timePoints.add(session.endTime);
      }
    }
  }

  const sortedTimes = [...timePoints].sort((a, b) => {
    return timeToMinutes(a) - timeToMinutes(b);
  });

  const excludedSlots = [
    ["07:30", "08:40"],
    ["16:15", "17:00"],
    ["18:00", "21:00"],
  ];

  const periods = [];

  for (let i = 0; i < sortedTimes.length - 1; i++) {
    const start = sortedTimes[i];
    const end = sortedTimes[i + 1];

    const isExcluded = excludedSlots.some(
      ([excludedStart, excludedEnd]) =>
        start === excludedStart && end === excludedEnd,
    );

    if (isExcluded) {
      continue;
    }

    periods.push({
      index: periods.length,
      start,
      end,
      startMinutes: timeToMinutes(start),
      endMinutes: timeToMinutes(end),
    });
  }

  return periods;
}

function getOverlappingPeriods(session, periods) {
  const sessionStart = timeToMinutes(session.startTime);
  const sessionEnd = timeToMinutes(session.endTime);

  if (
    sessionStart === null ||
    sessionEnd === null ||
    sessionEnd <= sessionStart
  ) {
    return [];
  }

  return periods.filter((period) => {
    return sessionStart < period.endMinutes && sessionEnd > period.startMinutes;
  });
}

// function mapSessionsToPeriods(day, periods) {
//   const sessions = day.sessions || [];

//   return sessions.map((session) => {
//     const matchedPeriods = getOverlappingPeriods(session, periods);

//     return {
//       session,
//       periods: matchedPeriods,
//       startPeriodIndex:
//         matchedPeriods.length > 0 ? matchedPeriods[0].index : null,
//       endPeriodIndex:
//         matchedPeriods.length > 0
//           ? matchedPeriods[matchedPeriods.length - 1].index
//           : null,
//     };
//   });
// }

// function isSessionFullyInsidePeriod(session, period) {
//   const sessionStart = timeToMinutes(session.startTime);
//   const sessionEnd = timeToMinutes(session.endTime);

//   if (
//     sessionStart === null ||
//     sessionEnd === null ||
//     sessionEnd <= sessionStart
//   ) {
//     return false;
//   }

//   return sessionStart >= period.startMinutes && sessionEnd <= period.endMinutes;
// }

function getSessionPeriodRange(session, periods) {
  const sessionStart = timeToMinutes(session.startTime);
  const sessionEnd = timeToMinutes(session.endTime);

  if (
    sessionStart === null ||
    sessionEnd === null ||
    sessionEnd <= sessionStart
  ) {
    return null;
  }

  // Session jis exact PDF period se start hota hai
  const startPeriod = periods.find(
    (period) =>
      sessionStart >= period.startMinutes && sessionStart < period.endMinutes,
  );

  // Session jis exact PDF period par end hota hai
  const endPeriod = periods.find(
    (period) =>
      sessionEnd > period.startMinutes && sessionEnd <= period.endMinutes,
  );

  if (!startPeriod || !endPeriod) {
    return null;
  }

  return {
    startIndex: startPeriod.index,
    endIndex: endPeriod.index,
    span: endPeriod.index - startPeriod.index + 1,
  };
}

function canVerticallyMerge(session1, session2) {
  if (!session1 || !session2) {
    return false;
  }

  const verticalMergeTypes = [
    "SQUAD_DRILL",
    "ROLL_CALL",
    "BREAK",
    "LUNCH",
    "MAINTENANCE",
    "GAMES",
  ];

  if (
    !verticalMergeTypes.includes(session1.type) ||
    !verticalMergeTypes.includes(session2.type)
  ) {
    return false;
  }

  return (
    session1.startTime === session2.startTime &&
    session1.endTime === session2.endTime &&
    session1.type === session2.type &&
    (session1.title || "") === (session2.title || "")
  );
}

function getVerticalMergeRange(days, dayIndex, session, periodIndex, periods) {
  let endDayIndex = dayIndex;

  for (let i = dayIndex + 1; i < days.length; i++) {
    const nextDaySession = (days[i].sessions || []).find((item) => {
      const range = getSessionPeriodRange(item, periods);

      if (!range) {
        return false;
      }

      return periodIndex >= range.startIndex && periodIndex <= range.endIndex;
    });

    if (!nextDaySession || !canVerticallyMerge(session, nextDaySession)) {
      break;
    }

    endDayIndex = i;
  }

  return {
    startDayIndex: dayIndex,
    endDayIndex,
    rowSpan: endDayIndex - dayIndex + 1,
  };
}

function isVerticalMergeStart(days, dayIndex, session, periodIndex, periods) {
  if (dayIndex === 0) {
    return true;
  }

  const previousDay = days[dayIndex - 1];

  const previousSession = (previousDay.sessions || []).find((item) => {
    const range = getSessionPeriodRange(item, periods);

    if (!range) {
      return false;
    }

    return periodIndex >= range.startIndex && periodIndex <= range.endIndex;
  });

  if (!previousSession) {
    return true;
  }

  return !canVerticallyMerge(session, previousSession);
}

function getHorizontalTextFontSize(text) {
  if (!text) return 7;

  const maxLines = 2;
  const charsPerLine = 25;

  const estimatedLines = Math.ceil(text.length / charsPerLine);

  if (estimatedLines <= maxLines) {
    return 7;
  }

  const fontSize = (7 * maxLines) / estimatedLines;

  return Math.max(5, fontSize);
}

function createSessionCell(session) {
  if (!session) {
    return {
      text: "",
      alignment: "center",
      valign: "middle",
    };
  }
  const title = getSessionDisplayTitle(session);
  const fontSize = getHorizontalTextFontSize(title);
  return {
    text: title,
    alignment: "center",
    valign: "middle",
    noWrap: false,
    fontSize: fontSize,
    bold: true,
    margin: [1, 1, 1, 1],
  };
}

function getVerticalTextFontSize(text, availableHeight) {
  const maxFontSize = 8;
  const minFontSize = 5;

  if (!text) {
    return maxFontSize;
  }

  const estimatedWidth = text.length * 0.55 * maxFontSize;

  if (estimatedWidth <= availableHeight - 4) {
    return maxFontSize;
  }

  const calculatedSize = (availableHeight - 4) / (text.length * 0.55);

  return Math.max(minFontSize, Math.min(maxFontSize, calculatedSize));
}

function getHorizontalTextFontSize(text) {
  if (!text) return 7;
  const maxLines = 2;
  const charsPerLine = 25;
  const estimatedLines = Math.ceil(text.length / charsPerLine);
  if (estimatedLines <= maxLines) {
    return 7;
  }
  const fontSize = (7 * maxLines) / estimatedLines;
  return Math.max(5, fontSize);
}

function createVerticalSessionCell(session, rowSpan = 1) {
  if (!session) {
    return {
      text: "",
      alignment: "center",
      valign: "middle",
    };
  }

  const title = getSessionDisplayTitle(session);
  const availableHeight = rowSpan * 21;
  const fontSize = getVerticalTextFontSize(title, availableHeight);

  return {
    svg: `
      <svg
        width="18"
        height="${availableHeight}"
        viewBox="0 0 18 ${availableHeight}"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          transform="translate(9 ${availableHeight / 2}) rotate(90)"
        >
          <text
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="Helvetica"
            font-size="${fontSize}"
            font-weight="bold"
            fill="#000000"
          >${title}</text>
        </g>
      </svg>
    `,

    alignment: "center",
    valign: "middle",
  };
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
}

function buildCourseHeader(course) {
  const startDateStr = formatDate(course.startDate);
  const endDateStr = formatDate(course.endDate);

  const ordinal = course.ordinal || "";
  const courseNameUpper = String(course.courseName || "").toUpperCase();

  return {
    stack: [
      {
        text: `${course.courseNumber}${ordinal} ${courseNameUpper} (${startDateStr} TO ${endDateStr})`,
        alignment: "center",
        bold: true,
        fontSize: 12,
        margin: [0, 0, 0, 2],
      },
      {
        text: "CENTRE FOR FIRE, EXPLOSIVE & ENVIRONMENT SAFETY (CFEES), DRDO SKILL DEVELOPMENT CENTRE (SDC), PILKHUWA, U.P.-245304",
        alignment: "center",
        bold: true,
        fontSize: 10,
        margin: [0, 0, 0, 1.5],
      },
      {
        text: "MINISTRY OF DEFENCE, GOVT. OF INDIA",
        alignment: "center",
        bold: true,
        fontSize: 9.5,
        margin: [0, 0, 0, 5],
      },
    ],
  };
}

function buildWeekTitle(week) {
  const days = week.days || [];

  if (days.length === 0) {
    return {
      text: `WEEK-${week.weekNumber}: No days scheduled.`,
      fontSize: 8,
      margin: [0, 4, 0, 4],
    };
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const weekStartStr = formatOrdinalDayMonth(firstDay.date);
  const weekEndStr = formatOrdinalDayMonth(lastDay.date);
  const yearStr = new Date(firstDay.date).getFullYear();

  return {
    text: `WEEK-${week.weekNumber} TRAINING SCHEDULE (${weekStartStr} - ${weekEndStr} ${yearStr})`,
    bold: true,
    fontSize: 9,
    margin: [0, 2, 0, 2],
  };
}

function buildWeekNotes(week, signatoryDoc) {
  const weekNumber = week.weekNumber;

  const subName = (
    signatoryDoc?.authorities?.find((authority) => authority.key === "sub")
      ?.name || "DEVENDRA SINGH"
  ).toUpperCase();

  const nbSubName = (
    signatoryDoc?.authorities?.find((authority) => authority.key === "nbSub")
      ?.name || "PARMOD KUMAR"
  ).toUpperCase();

  const dutyJcoLine = {
    text: [
      { text: "DUTY JCO/Squad Drill: ", bold: true, decoration: "underline" },
      { text: `SUB ${subName} & Nb SUB ${nbSubName},`, bold: true },
      {
        text: `Week-${weekNumber} Practical Instructors* (P)`,
        bold: true,
        decoration: "underline",
      },
      { text: "-CFEES", bold: true },
    ],
    fontSize: 8,
    margin: [0, 2, 0, 1],
  };

  // EVEN WEEK → 3 lines
  if (weekNumber % 2 === 0) {
    const parts = [];
    if (week.docSupport1 && week.docSupport1.trim()) {
      parts.push(week.docSupport1.trim());
    }
    if (week.docSupport2 && week.docSupport2.trim()) {
      parts.push(week.docSupport2.trim());
    }

    const stackItems = [
      {
        text: [
          {
            text: "DUTY JCO/Squad Drill: ",
            bold: true,
            decoration: "underline",
          },
          { text: `SUB ${subName} & Nb SUB ${nbSubName},`, bold: true },
          {
            text: `Week-${weekNumber} Practical Instructors* (P)`,
            bold: true,
            decoration: "underline",
          },
          { text: "-CFEES", bold: true },
        ],
        fontSize: 8,
        margin: [0, 2, 0, 3],
      },
      {
        text: "EVERY WEEK TUESDAY- MANDIR PARADE & WEDNESDAY- SHRAMDAN (1630 - 1730 Hrs)",
        bold: true,
        fontSize: 8,
        margin: [0, 0, 0, 3],
      },
    ];

    if (parts.length > 0) {
      stackItems.push({
        text: `Documentation Support- ${parts.join(", ")}`,
        fontSize: 8,
        bold: true,
        margin: [0, 0, 0, 4],
      });
    }

    return { stack: stackItems };
  }

  // ODD WEEK → 1 line
  return {
    ...dutyJcoLine,
    margin: [0, 2, 0, 4],
  };
}

function buildSignatures(signatoryDoc) {
  const getAuth = (key, defaultName, defaultDesig) => {
    if (!signatoryDoc || !signatoryDoc.authorities) {
      return {
        name: defaultName,
        desig: defaultDesig,
      };
    }

    const auth = signatoryDoc.authorities.find((a) => a.key === key);

    return auth
      ? {
          name: auth.name || defaultName,
          desig: auth.designation || defaultDesig,
        }
      : {
          name: defaultName,
          desig: defaultDesig,
        };
  };

  const dyCoord = getAuth(
    "deputyCourseCoordinator",
    "Sh. Anil Kumar",
    "TO 'C'",
  );

  const coord = getAuth("courseCoordinator", "Rohit Arse", "Sc 'C'");

  const dir = getAuth("courseDirector", "Lavkush Kumar", "Sc 'E'");

  const ad = getAuth("associateDirector", "M K Kalra", "Sc 'G'");

  return {
    stack: [
      {
        columns: [
          {
            text: `(${dyCoord.name})\n${dyCoord.desig} & Dy. Course Coordinator`,
            alignment: "center",
            bold: true,
            fontSize: 9.2,
          },
          {
            text: `(${coord.name})\n${coord.desig} & Course Coordinator`,
            alignment: "center",
            bold: true,
            fontSize: 9.2,
          },
          {
            text: `(${dir.name})\n${dir.desig} & Course Director`,
            alignment: "center",
            bold: true,
            fontSize: 9.2,
          },
          {
            text: `(${ad.name})\n${ad.desig} & AD (SDC)`,
            alignment: "center",
            bold: true,
            fontSize: 9.2,
          },
        ],
        margin: [0, 16, 0, 2],
      },

      {
        text: "Copy to: Head, TCP& HR (For hosting on CFEES e-portal for information of all concerned)",
        fontSize: 8,
        bold: true,
        margin: [0, 2, 0, 2],
      },

      {
        text: "*For practical sessions, Instructors shall be supported by DFS Staff at SDC in batches.",
        fontSize: 8,
        italics: true,
        bold: true,
      },
    ],
  };
}

function formatOrdinalDayMonth(date) {
  if (!date) return "";

  const d = new Date(date);
  const day = d.getDate();

  const nth =
    day > 3 && day < 21
      ? "th"
      : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][day % 10];

  const month = d.toLocaleDateString("en-GB", {
    month: "short",
  });

  return `${String(day).padStart(2, "0")}${nth} ${month}`;
}

function buildWeekGrid(week, periods) {
  const days = week.days || [];

  const grid = [];

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];

    const row = [];

    for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
      const period = periods[periodIndex];

      const session = (day.sessions || []).find((item) => {
        const range = getSessionPeriodRange(item, periods);

        return range && range.startIndex === periodIndex;
      });

      row.push({
        dayIndex,
        periodIndex,
        session: session || null,
      });
    }

    grid.push(row);
  }

  return {
    days,
    periods,
    grid,
  };
}

function applyVerticalMergeInfo(weekGrid) {
  const { days, periods, grid } = weekGrid;

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
      const cell = grid[dayIndex][periodIndex];

      if (!cell.session) {
        continue;
      }

      const session = cell.session;

      // Is session ka horizontal range
      const horizontalRange = getSessionPeriodRange(session, periods);

      if (!horizontalRange) {
        continue;
      }

      // Agar ye vertical merge ka continuation hai
      if (
        !isVerticalMergeStart(days, dayIndex, session, periodIndex, periods)
      ) {
        cell.skip = true;
        continue;
      }

      const verticalRange = getVerticalMergeRange(
        days,
        dayIndex,
        session,
        periodIndex,
        periods,
      );

      cell.rowSpan = verticalRange.rowSpan;
      cell.colSpan = horizontalRange.span;

      /*
       * Horizontal span ke baaki cells ko skip mark karo
       */
      for (
        let p = horizontalRange.startIndex + 1;
        p <= horizontalRange.endIndex;
        p++
      ) {
        grid[dayIndex][p].skip = true;
      }

      for (let d = dayIndex + 1; d <= verticalRange.endDayIndex; d++) {
        const nextDaySessions = days[d].sessions || [];

        const sameSession = nextDaySessions.find((nextSession) =>
          canVerticallyMerge(session, nextSession),
        );

        if (!sameSession) {
          continue;
        }

        const nextRange = getSessionPeriodRange(sameSession, periods);

        if (!nextRange) {
          continue;
        }

        for (let p = nextRange.startIndex; p <= nextRange.endIndex; p++) {
          grid[d][p].skip = true;
        }
      }
    }
  }

  return weekGrid;
}

function buildTimeHeaderRow(periods, week) {
  const headerRow1 = [];

  const greyTypes = ["BREAK", "LUNCH", "ROLL_CALL"];

  function isPeriodGrey(periodIndex) {
    return (week.days || []).some((day) => {
      return (day.sessions || []).some((session) => {
        if (!greyTypes.includes(session.type)) {
          return false;
        }

        const range = getSessionPeriodRange(session, periods);

        return (
          range &&
          periodIndex >= range.startIndex &&
          periodIndex <= range.endIndex
        );
      });
    });
  }

  const headerRow2 = [];

  // DATE
  headerRow1.push({
    text: "DATE",
    rowSpan: 2,
    alignment: "center",
    valign: "middle",
    bold: true,
    fontSize: 8,
  });

  // DAY
  headerRow1.push({
    text: "DAY",
    rowSpan: 2,
    alignment: "center",
    valign: "middle",
    bold: true,
    fontSize: 8,
  });

  const practicalStart = periods.findIndex(
    (period) => period.start === "09:00",
  );

  const theoryStart = periods.findIndex((period) => period.start === "11:45");

  const theoryEnd = periods.findIndex((period) => period.end === "15:00");

  for (let i = 0; i < periods.length; i++) {
    // PRACTICAL CLASSES
    if (i === practicalStart && theoryStart !== -1) {
      const span = theoryStart - practicalStart;

      headerRow1.push({
        text: "PRACTICAL CLASSES",
        colSpan: span,
        alignment: "center",
        valign: "middle",
        bold: true,
        fontSize: 8,
      });

      for (let j = 1; j < span; j++) {
        headerRow1.push({});
      }

      i = theoryStart - 1;
      continue;
    }

    // THEORY CLASSES
    if (i === theoryStart && theoryEnd !== -1) {
      const span = theoryEnd - theoryStart + 1;

      headerRow1.push({
        text: "THEORY CLASSES",
        colSpan: span,
        alignment: "center",
        valign: "middle",
        bold: true,
        fontSize: 8,
      });

      for (let j = 1; j < span; j++) {
        headerRow1.push({});
      }

      i = theoryEnd;
      continue;
    }

    headerRow1.push({
      text: `${periods[i].start}\n-\n${periods[i].end} Hrs`,
      rowSpan: 2,
      alignment: "center",
      valign: "middle",
      bold: true,
      fontSize: 7,
      fillColor: isPeriodGrey(i) ? "#eeeeee" : undefined,
    });
  }

  headerRow2.push({});
  headerRow2.push({});

  for (let i = 0; i < periods.length; i++) {
    const insidePractical =
      practicalStart !== -1 &&
      theoryStart !== -1 &&
      i >= practicalStart &&
      i < theoryStart;

    const insideTheory =
      theoryStart !== -1 &&
      theoryEnd !== -1 &&
      i >= theoryStart &&
      i <= theoryEnd;

    if (insidePractical || insideTheory) {
      headerRow2.push({
        text: `${periods[i].start}\n-\n${periods[i].end} Hrs`,
        alignment: "center",
        valign: "middle",
        bold: true,
        fontSize: 7,
        fillColor: isPeriodGrey(i) ? "#eeeeee" : undefined,
      });
    } else {
      // Above column already has rowSpan: 2
      headerRow2.push({});
    }
  }

  return [headerRow1, headerRow2];
}

function isGreySession(session) {
  if (!session) {
    return false;
  }

  return ["ROLL_CALL", "BREAK", "LUNCH"].includes(session.type);
}

function buildPdfRows(weekGrid, holidays) {
  const { days, periods, grid } = weekGrid;

  const rows = [];

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    const holiday = findHoliday(day, holidays);
    const row = [];

    // DATE
    row.push({
      text: formatDate(day.date),
      alignment: "center",
      valign: "middle",
      fontSize: 7,
      bold: true,
      margin: [1, 2, 1, 2],
    });

    // DAY
    row.push({
      text: day.day || "",
      alignment: "center",
      valign: "middle",
      fontSize: 7,
      bold: true,
      margin: [1, 2, 1, 2],
    });

    // HOLIDAY
    if (holiday) {
      row.push({
        text: `HOLIDAY : ${holiday.Occasion || ""}`,
        colSpan: periods.length,
        alignment: "center",
        valign: "middle",
        bold: true,
        fontSize: 8.5,
        margin: [0, 2, 0, 2],
      });

      // Remaining period cells ko skip karo
      for (let i = 1; i < periods.length; i++) {
        row.push({
          text: "",
        });
      }

      rows.push(row);
      continue;
    }

    // PERIOD CELLS
    for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) {
      const cell = grid[dayIndex][periodIndex];

      if (cell.skip) {
        row.push({
          text: "",
        });
        continue;
      }

      if (!cell.session) {
        row.push({
          text: "",
          alignment: "center",
          valign: "middle",
        });

        continue;
      }

      let pdfCell;

      if (cell.rowSpan > 1 && isRotatableSession(cell.session)) {
        pdfCell = createVerticalSessionCell(cell.session, cell.rowSpan);
      } else {
        pdfCell = createSessionCell(cell.session);
      }

      if (isGreySession(cell.session)) {
        pdfCell.fillColor = "#eeeeee";
      }

      if (cell.colSpan > 1) {
        pdfCell.colSpan = cell.colSpan;
      }

      if (cell.rowSpan > 1) {
        pdfCell.rowSpan = cell.rowSpan;
      }

      row.push(pdfCell);
    }

    rows.push(row);
  }

  return rows;
}

function generateSchedulePDF(res, course, schedule, holidays, signDoc) {
  try {
    const scheduleData = prepareScheduleData(schedule);

    const content = [];

    for (let pageStart = 0; pageStart < scheduleData.length; pageStart += 2) {
      const pageWeeks = scheduleData.slice(pageStart, pageStart + 2);

      content.push(buildCourseHeader(course));

      for (let weekIndex = 0; weekIndex < pageWeeks.length; weekIndex++) {
        const week = pageWeeks[weekIndex];
        content.push(buildWeekTitle(week));

        const weekPeriods = buildWeekPeriods(week);

        const weekGrid = buildWeekGrid(week, weekPeriods);

        applyVerticalMergeInfo(weekGrid);

        const headerRow = buildTimeHeaderRow(weekPeriods, week);

        const bodyRows = buildPdfRows(weekGrid, holidays);

        const weekBody = [...headerRow, ...bodyRows];

        const weekWidths = [
          40, // DATE
          45, // DAY

          ...weekPeriods.map((period) => {
            let isFixedType = false;

            for (const day of week.days || []) {
              const session = (day.sessions || []).find((item) => {
                const range = getSessionPeriodRange(item, weekPeriods);

                return (
                  range &&
                  period.index >= range.startIndex &&
                  period.index <= range.endIndex
                );
              });

              if (
                session &&
                [
                  "SQUAD_DRILL",
                  "ROLL_CALL",
                  "BREAK",
                  "LUNCH",
                  "MAINTENANCE",
                  "GAMES",
                ].includes(session.type)
              ) {
                isFixedType = true;
                break;
              }
            }

            return isFixedType ? 22 : "*";
          }),
        ];

        content.push({
          table: {
            headerRows: 2,
            widths: weekWidths,
            body: weekBody,
            heights: (rowIndex) => {
              let dayheights = 23;
              let headerheights = 14;
              if (rowIndex === 0 || rowIndex === 1) {
                return headerheights;
              }

              return dayheights;
            },
            body: weekBody,
          },

          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,

            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
        });

        content.push(buildWeekNotes(week, signDoc));

        if (weekIndex < pageWeeks.length - 1) {
          content.push({
            canvas: [
              {
                type: "line",
                x1: 0,
                y1: 2.5,
                x2: 800,
                y2: 2.5,
                lineWidth: 0.8,
                dash: {
                  length: 3,
                  space: 3,
                },
              },
            ],
            margin: [0, 2, 0, 8],
          });
        }
      }

      content.push(buildSignatures(signDoc));

      if (pageStart + 2 < scheduleData.length) {
        content.push({
          text: "",
          pageBreak: "before",
        });
      }
    }

    const docDefinition = {
      pageSize: "A4",
      pageOrientation: "landscape",

      pageMargins: [20, 20, 20, 20],

      content: content,
    };

    const fonts = {
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    const printer = new PdfPrinter(fonts);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      'inline; filename="course-schedule.pdf"',
    );

    pdfDoc.pipe(res);

    pdfDoc.end();
  } catch (error) {
    console.error("Course Schedule PDF Error:", error);

    if (!res.headersSent) {
      res.status(500).send("Failed to generate course schedule PDF");
    }
  }
}

module.exports = {
  generateSchedulePDF,
};
