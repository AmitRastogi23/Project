document.addEventListener("DOMContentLoaded", () => {
  const navBtns = document.querySelectorAll(
    ".nav-btn:not(#practicalDropdownBtn)",
  );
  const navSubBtns = document.querySelectorAll(".nav-sub-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const practicalDropdown = document.querySelector(".nav-dropdown");
  const practicalDropdownBtn = document.getElementById("practicalDropdownBtn");

  function activateTab(target) {
    navBtns.forEach((b) => b.classList.remove("active"));
    navSubBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    const targetBtn = document.querySelector(`[data-target="${target}"]`);
    if (targetBtn) targetBtn.classList.add("active");
    const tabToShow = document.getElementById(`tab-${target}`);
    if (tabToShow) tabToShow.classList.add("active");

    if (target.includes("practical")) {
      practicalDropdownBtn.classList.add("active");
    } else {
      practicalDropdownBtn.classList.remove("active");
    }

    sessionStorage.setItem("activeResultTab", target);
  }

  const activeTabTarget = sessionStorage.getItem("activeResultTab") || "theory";
  activateTab(activeTabTarget);

  practicalDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    practicalDropdown.classList.toggle("show");
  });

  window.addEventListener("click", (e) => {
    if (!practicalDropdown.contains(e.target)) {
      practicalDropdown.classList.remove("show");
    }
  });

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.target);
      practicalDropdown.classList.remove("show");
    });
  });

  navSubBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      activateTab(btn.dataset.target);
      practicalDropdown.classList.remove("show");
    });
  });

  // Dropdown Logic for Conduct Tab
  const conductDropdown = document.getElementById("conductDropdown");
  const downloadDropdownBtn = document.getElementById("downloadDropdownBtn");
  if (downloadDropdownBtn) {
    downloadDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      conductDropdown.classList.toggle("show");
    });
  }

  window.addEventListener("click", (e) => {
    if (conductDropdown && !conductDropdown.contains(e.target)) {
      conductDropdown.classList.remove("show");
    }
  });

  document
    .getElementById("downloadExaminerBtn")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      conductDropdown.classList.remove("show");
      window.open(
        `/course/${window.courseId}/result/conduct/examiner-sheet`,
        "_blank",
      );
    });

  document
    .getElementById("downloadMarksBtn")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      conductDropdown.classList.remove("show");
      window.open(
        `/course/${window.courseId}/result/conduct/marks-sheet`,
        "_blank",
      );
    });

  function loadConfigData() {
    if (!window.courseConfig) return;

    document.getElementById("configMaxMarks").value =
      window.courseConfig.maxMarks || 15;
    document.getElementById("configMinMarks").value =
      window.courseConfig.minMarks || 9;

    if (
      window.courseConfig.evaluators &&
      window.courseConfig.evaluators.length >= 3
    ) {
      const e1 = window.courseConfig.evaluators[0].name || "Evaluator 1";
      const e2 = window.courseConfig.evaluators[1].name || "Evaluator 2";
      const e3 = window.courseConfig.evaluators[2].name || "Evaluator 3";

      document.getElementById("evalName1").value =
        e1 === "Evaluator 1" ? "" : e1;
      document.getElementById("evalName2").value =
        e2 === "Evaluator 2" ? "" : e2;
      document.getElementById("evalName3").value =
        e3 === "Evaluator 3" ? "" : e3;

      document.getElementById("thEval1").textContent = e1;
      document.getElementById("thEval2").textContent = e2;
      document.getElementById("thEval3").textContent = e3;
    }
  }

  function loadStudentMarks() {
    if (!window.results || window.results.length === 0) return;

    window.results.forEach((result) => {
      // Enrollment ID match from ObjectId string
      const row = document.querySelector(
        `tr[data-enrollment-id="${result.enrollmentId.toString()}"]`,
      );
      if (!row) return;

      const marks = result.conductKeenness?.marks || [];
      const avg = result.conductKeenness?.average;

      marks.forEach((m) => {
        if (m.evaluatorKey === "eval_1" && row.querySelector(".conduct-eval-1"))
          row.querySelector(".conduct-eval-1").value = m.marks;
        if (m.evaluatorKey === "eval_2" && row.querySelector(".conduct-eval-2"))
          row.querySelector(".conduct-eval-2").value = m.marks;
        if (m.evaluatorKey === "eval_3" && row.querySelector(".conduct-eval-3"))
          row.querySelector(".conduct-eval-3").value = m.marks;
      });

      if (
        avg !== null &&
        avg !== undefined &&
        row.querySelector(".total-avg")
      ) {
        row.querySelector(".total-avg").value = avg;
      }
    });
  }

  function loadPracticalConfig() {
    const config = window.practicalConfig || {};

    if (config.midTerm) {
      document.getElementById("pmExaminer").value =
        config.midTerm.examinerName || "";
      document.getElementById("pmInvigilator").value =
        config.midTerm.invigilatorName || "";

      const subs = config.midTerm.subjects || [];
      if (subs[0]) {
        document.getElementById("pmSub1Title").value = subs[0].title;
        document.getElementById("pmSub1Max").value = subs[0].maxMarks;
        document.getElementById("pmSub1Min").value = subs[0].minMarks;
        document.getElementById("pmThSub1").childNodes[0].nodeValue =
          subs[0].title + " ";
        document.getElementById("pmThSub1MaxMin").textContent =
          `(${String(subs[0].minMarks).padStart(2, "0")}/${String(subs[0].maxMarks).padStart(2, "0")})`;
      }
      if (subs[1]) {
        document.getElementById("pmSub2Title").value = subs[1].title;
        document.getElementById("pmSub2Max").value = subs[1].maxMarks;
        document.getElementById("pmSub2Min").value = subs[1].minMarks;
        document.getElementById("pmThSub2").childNodes[0].nodeValue =
          subs[1].title + " ";
        document.getElementById("pmThSub2MaxMin").textContent =
          `(${String(subs[1].minMarks).padStart(2, "0")}/${String(subs[1].maxMarks).padStart(2, "0")})`;
      }

      const totalMax = subs.reduce(
        (sum, s) => sum + (Number(s.maxMarks) || 0),
        0,
      );
      const totalMin = subs.reduce(
        (sum, s) => sum + (Number(s.minMarks) || 0),
        0,
      );
      document.getElementById("pmThTotalMaxMin").textContent =
        `(${String(totalMin).padStart(2, "0")}/${String(totalMax).padStart(2, "0")})`;
    }

    if (config.finalTerm) {
      document.getElementById("pfExaminer").value =
        config.finalTerm.examinerName || "";
      document.getElementById("pfInvigilator").value =
        config.finalTerm.invigilatorName || "";

      const subs = config.finalTerm.subjects || [];
      if (subs[0]) {
        document.getElementById("pfSub1Title").value = subs[0].title;
        document.getElementById("pfSub1Max").value = subs[0].maxMarks;
        document.getElementById("pfSub1Min").value = subs[0].minMarks;
        document.getElementById("pfThSub1").childNodes[0].nodeValue =
          subs[0].title + " ";
        document.getElementById("pfThSub1MaxMin").textContent =
          `(${String(subs[0].minMarks).padStart(2, "0")}/${String(subs[0].maxMarks).padStart(2, "0")})`;
      }
      if (subs[1]) {
        document.getElementById("pfSub2Title").value = subs[1].title;
        document.getElementById("pfSub2Max").value = subs[1].maxMarks;
        document.getElementById("pfSub2Min").value = subs[1].minMarks;
        document.getElementById("pfThSub2").childNodes[0].nodeValue =
          subs[1].title + " ";
        document.getElementById("pfThSub2MaxMin").textContent =
          `(${String(subs[1].minMarks).padStart(2, "0")}/${String(subs[1].maxMarks).padStart(2, "0")})`;
      }
      if (subs[2]) {
        document.getElementById("pfSub3Title").value = subs[2].title;
        document.getElementById("pfSub3Max").value = subs[2].maxMarks;
        document.getElementById("pfSub3Min").value = subs[2].minMarks;
        document.getElementById("pfThSub3").childNodes[0].nodeValue =
          subs[2].title + " ";
        document.getElementById("pfThSub3MaxMin").textContent =
          `(${String(subs[2].minMarks).padStart(2, "0")}/${String(subs[2].maxMarks).padStart(2, "0")})`;
      }
      if (subs[3]) {
        document.getElementById("pfSub4Title").value = subs[3].title;
        document.getElementById("pfSub4Max").value = subs[3].maxMarks;
        document.getElementById("pfSub4Min").value = subs[3].minMarks;
        document.getElementById("pfThSub4").childNodes[0].nodeValue =
          subs[3].title + " ";
        document.getElementById("pfThSub4MaxMin").textContent =
          `(${String(subs[3].minMarks).padStart(2, "0")}/${String(subs[3].maxMarks).padStart(2, "0")})`;
      }

      const totalMax = subs.reduce(
        (sum, s) => sum + (Number(s.maxMarks) || 0),
        0,
      );
      const totalMin = subs.reduce(
        (sum, s) => sum + (Number(s.minMarks) || 0),
        0,
      );
      document.getElementById("pfThTotalMaxMin").textContent =
        `(${String(totalMin).padStart(2, "0")}/${String(totalMax).padStart(2, "0")})`;
    }
  }

  loadConfigData();
  loadStudentMarks();
  loadPracticalConfig();

  document
    .getElementById("saveConfigBtn")
    ?.addEventListener("click", async () => {
      const maxMarks = document.getElementById("configMaxMarks").value;
      const minMarks = document.getElementById("configMinMarks").value;
      const evaluators = [
        {
          key: "eval_1",
          name: document.getElementById("evalName1").value.trim(),
        },
        {
          key: "eval_2",
          name: document.getElementById("evalName2").value.trim(),
        },
        {
          key: "eval_3",
          name: document.getElementById("evalName3").value.trim(),
        },
      ];

      const btn = document.getElementById("saveConfigBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;

      try {
        const res = await fetch(
          `/course/${window.courseId}/result/conduct-config`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maxMarks, minMarks, evaluators }),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Configuration saved successfully!");
          window.courseConfig = data.data;
          loadConfigData();
        } else {
          alert(data.message || "Failed to save config");
        }
      } catch (err) {
        alert("Error saving config.");
      } finally {
        btn.textContent = "Save Config";
        btn.disabled = false;
      }
    });

  document
    .getElementById("savePractMidConfigBtn")
    ?.addEventListener("click", async () => {
      const dataToSave = {
        term: "midTerm",
        examinerName: document.getElementById("pmExaminer").value,
        invigilatorName: document.getElementById("pmInvigilator").value,
        subjects: [
          {
            title: document.getElementById("pmSub1Title").value,
            maxMarks: document.getElementById("pmSub1Max").value,
            minMarks: document.getElementById("pmSub1Min").value,
          },
          {
            title: document.getElementById("pmSub2Title").value,
            maxMarks: document.getElementById("pmSub2Max").value,
            minMarks: document.getElementById("pmSub2Min").value,
          },
        ],
      };

      try {
        const res = await fetch(
          `/course/${window.courseId}/result/practical-config`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSave),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Mid-Term Config saved!");
          window.practicalConfig = data.data;
          loadPracticalConfig();
        } else alert(data.message);
      } catch (err) {
        alert("Error saving config");
      }
    });

  document
    .getElementById("savePractFinalConfigBtn")
    ?.addEventListener("click", async () => {
      const dataToSave = {
        term: "finalTerm",
        examinerName: document.getElementById("pfExaminer").value,
        invigilatorName: document.getElementById("pfInvigilator").value,
        subjects: [
          {
            title: document.getElementById("pfSub1Title").value,
            maxMarks: document.getElementById("pfSub1Max").value,
            minMarks: document.getElementById("pfSub1Min").value,
          },
          {
            title: document.getElementById("pfSub2Title").value,
            maxMarks: document.getElementById("pfSub2Max").value,
            minMarks: document.getElementById("pfSub2Min").value,
          },
          {
            title: document.getElementById("pfSub3Title").value,
            maxMarks: document.getElementById("pfSub3Max").value,
            minMarks: document.getElementById("pfSub3Min").value,
          },
          {
            title: document.getElementById("pfSub4Title").value,
            maxMarks: document.getElementById("pfSub4Max").value,
            minMarks: document.getElementById("pfSub4Min").value,
          },
        ],
      };

      try {
        const res = await fetch(
          `/course/${window.courseId}/result/practical-config`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSave),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Final-Term Config saved!");
          window.practicalConfig = data.data;
          loadPracticalConfig();
        } else alert(data.message);
      } catch (err) {
        alert("Error saving config");
      }
    });

  document
    .getElementById("saveConductMarksBtn")
    ?.addEventListener("click", async () => {
      const rows = document.querySelectorAll(
        "#tab-conduct tbody tr[data-enrollment-id]",
      );
      const marksData = [];

      rows.forEach((row) => {
        const enrollmentId = row.dataset.enrollmentId;
        const eval1 = row.querySelector(".conduct-eval-1").value;
        const eval2 = row.querySelector(".conduct-eval-2").value;
        const eval3 = row.querySelector(".conduct-eval-3").value;

        if (eval1 !== "" || eval2 !== "" || eval3 !== "") {
          marksData.push({
            enrollmentId,
            eval_1: eval1,
            eval_2: eval2,
            eval_3: eval3,
          });
        }
      });

      if (marksData.length === 0) return alert("No marks entered to save.");

      const btn = document.getElementById("saveConductMarksBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;

      try {
        const res = await fetch(
          `/course/${window.courseId}/result/conduct-marks`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marksData }),
          },
        );
        const data = await res.json();

        if (data.success) {
          alert("Marks saved successfully!");
          window.location.reload();
        } else {
          alert(data.message || "Failed to save marks");
        }
      } catch (err) {
        alert("Error saving marks.");
      } finally {
        btn.textContent = "Save Marks";
        btn.disabled = false;
      }
    });

  const practMidTable = document.getElementById("tab-practical-mid");
  if (practMidTable) {
    practMidTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("pm-mark")) {
        const row = e.target.closest("tr");
        const marks = Array.from(row.querySelectorAll(".pm-mark")).map(
          (inp) => parseFloat(inp.value) || 0,
        );
        if (marks.some((m) => m > 0)) {
          row.querySelector(".pm-total").value = marks.reduce(
            (a, b) => a + b,
            0,
          );
        } else {
          row.querySelector(".pm-total").value = "";
        }
      }
    });
  }

  const practFinalTable = document.getElementById("tab-practical-final");
  if (practFinalTable) {
    practFinalTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("pf-mark")) {
        const row = e.target.closest("tr");
        const marks = Array.from(row.querySelectorAll(".pf-mark")).map(
          (inp) => parseFloat(inp.value) || 0,
        );
        if (marks.some((m) => m > 0)) {
          row.querySelector(".pf-total").value = marks.reduce(
            (a, b) => a + b,
            0,
          );
        } else {
          row.querySelector(".pf-total").value = "";
        }
      }
    });
  }

  const conductTable = document.getElementById("tab-conduct");
  if (conductTable) {
    conductTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("eval-mark")) {
        const row = e.target.closest("tr");
        const maxAllowed = window.courseConfig?.maxMarks || 15;
        const val = parseFloat(e.target.value);
        if (val < 0 || val > maxAllowed) {
          alert(`Marks must be 0 - ${maxAllowed}`);
          e.target.value = "";
          return;
        }
        const marks = Array.from(row.querySelectorAll(".eval-mark")).map(
          (input) => parseFloat(input.value) || 0,
        );
        if (marks.some((m) => m > 0)) {
          row.querySelector(".total-avg").value = (
            marks.reduce((a, b) => a + b, 0) / 3
          ).toFixed(2);
        } else {
          row.querySelector(".total-avg").value = "";
        }
      }
    });
  }

  const allTables = document.querySelectorAll(".tab-content table");
  allTables.forEach((table) => {
    table.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const currentInput = e.target;
        if (currentInput.tagName !== "INPUT") return;

        const currentRow = currentInput.closest("tr");
        if (!currentRow) return;

        const currentRowInputs = Array.from(
          currentRow.querySelectorAll("input"),
        );
        const colIndex = currentRowInputs.indexOf(currentInput);
        if (colIndex === -1) return;

        let nextRow = currentRow.nextElementSibling;
        if (nextRow) {
          const nextRowInputs = Array.from(nextRow.querySelectorAll("input"));
          if (nextRowInputs[colIndex]) {
            nextRowInputs[colIndex].focus();
            nextRowInputs[colIndex].select();
          }
        } else {
          const firstRow = table.querySelector("tbody tr");
          if (firstRow) {
            const firstRowInputs = Array.from(
              firstRow.querySelectorAll("input"),
            );
            if (firstRowInputs[colIndex]) {
              firstRowInputs[colIndex].focus();
              firstRowInputs[colIndex].select();
            }
          }
        }
      }
    });
  });
});
