document.addEventListener("DOMContentLoaded", () => {
  const navBtns = document.querySelectorAll(
    ".nav-btn:not(#practicalDropdownBtn):not(#theoryDropdownBtn)",
  );
  const navSubBtns = document.querySelectorAll(".nav-sub-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const navDropdowns = document.querySelectorAll(".nav-dropdown");
  const theoryDropdownBtn = document.getElementById("theoryDropdownBtn");
  const practicalDropdownBtn = document.getElementById("practicalDropdownBtn");

  function activateTab(target) {
    navBtns.forEach((b) => b.classList.remove("active"));
    navSubBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    const targetBtn = document.querySelector(`[data-target="${target}"]`);
    if (targetBtn) targetBtn.classList.add("active");
    const tabToShow = document.getElementById(`tab-${target}`);
    if (tabToShow) tabToShow.classList.add("active");

    theoryDropdownBtn?.classList.remove("active");
    practicalDropdownBtn?.classList.remove("active");
    if (target.startsWith("theory")) theoryDropdownBtn?.classList.add("active");
    else if (target.startsWith("practical"))
      practicalDropdownBtn?.classList.add("active");

    sessionStorage.setItem("activeResultTab", target);
  }

  const activeTabTarget =
    sessionStorage.getItem("activeResultTab") || "theory-mid";
  activateTab(activeTabTarget);

  // Dropdown toggles (Theory + Practical)
  navDropdowns.forEach((dd) => {
    const btn = dd.querySelector(".nav-btn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      navDropdowns.forEach((other) => {
        if (other !== dd) other.classList.remove("show");
      });
      dd.classList.toggle("show");
    });
  });
  window.addEventListener("click", (e) => {
    navDropdowns.forEach((dd) => {
      if (!dd.contains(e.target)) dd.classList.remove("show");
    });
  });

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.target) {
        activateTab(btn.dataset.target);
        navDropdowns.forEach((dd) => dd.classList.remove("show"));
      }
    });
  });
  navSubBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      activateTab(btn.dataset.target);
      navDropdowns.forEach((dd) => dd.classList.remove("show"));
    });
  });

  // Conduct download dropdown
  const conductDropdown = document.getElementById("conductDropdown");
  const downloadDropdownBtn = document.getElementById("downloadDropdownBtn");
  if (downloadDropdownBtn) {
    downloadDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      conductDropdown.classList.toggle("show");
    });
  }
  window.addEventListener("click", (e) => {
    if (conductDropdown && !conductDropdown.contains(e.target))
      conductDropdown.classList.remove("show");
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

  // ═══════════ LOADERS ═══════════

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

  function loadTheoryConfig() {
    const cfg = window.theoryConfig || {};
    if (cfg.midTerm) {
      document.getElementById("tmExaminer").value =
        cfg.midTerm.examinerName || "";
      document.getElementById("tmInvigilator").value =
        cfg.midTerm.invigilatorName || "";
      document.getElementById("tmMaxMarks").value = cfg.midTerm.maxMarks ?? 100;
      document.getElementById("tmMinMarks").value = cfg.midTerm.minMarks ?? 40;
      updateTheoryMidHeader();
    }
    if (cfg.finalTerm) {
      document.getElementById("tfExaminer").value =
        cfg.finalTerm.examinerName || "";
      document.getElementById("tfInvigilator").value =
        cfg.finalTerm.invigilatorName || "";
      document.getElementById("tfMaxMarks").value =
        cfg.finalTerm.maxMarks ?? 100;
      document.getElementById("tfMinMarks").value =
        cfg.finalTerm.minMarks ?? 40;
      updateTheoryFinalHeader();
    }
  }

  function updateTheoryMidHeader() {
    const max = Number(document.getElementById("tmMaxMarks").value) || 0;
    const min = Number(document.getElementById("tmMinMarks").value) || 0;
    const el = document.getElementById("tmThMaxMin");
    if (el)
      el.textContent = `(${String(min).padStart(2, "0")}/${String(max).padStart(2, "0")})`;
  }

  function updateTheoryFinalHeader() {
    const max = Number(document.getElementById("tfMaxMarks").value) || 0;
    const min = Number(document.getElementById("tfMinMarks").value) || 0;
    const p1 = document.getElementById("tfThP1MaxMin");
    if (p1)
      p1.textContent = `(${String(min).padStart(2, "0")}/${String(max).padStart(2, "0")})`;
    const p2 = document.getElementById("tfThP2MaxMin");
    if (p2)
      p2.textContent = `(${String(min).padStart(2, "0")}/${String(max).padStart(2, "0")})`;
  }

  function loadTheoryMarks() {
    if (!window.results || window.results.length === 0) return;
    window.results.forEach((r) => {
      const id = r.enrollmentId.toString();
      const midRow = document.querySelector(
        `#tab-theory-mid tr[data-enrollment-id="${id}"]`,
      );
      if (midRow && Array.isArray(r.theory?.midTerm) && r.theory.midTerm[0]) {
        const inp = midRow.querySelector(".tm-mark");
        if (inp) inp.value = r.theory.midTerm[0].obtained ?? "";
      }
      const finRow = document.querySelector(
        `#tab-theory-final tr[data-enrollment-id="${id}"]`,
      );
      if (finRow && Array.isArray(r.theory?.finalTerm)) {
        if (r.theory.finalTerm[0] != null) {
          const p1 = finRow.querySelector(".tf-p1");
          if (p1) p1.value = r.theory.finalTerm[0].obtained ?? "";
        }
        if (r.theory.finalTerm[1] != null) {
          const p2 = finRow.querySelector(".tf-p2");
          if (p2) p2.value = r.theory.finalTerm[1].obtained ?? "";
        }
      }
    });
  }

  function loadStudentMarks() {
    if (!window.results || window.results.length === 0) return;
    window.results.forEach((result) => {
      const id = result.enrollmentId.toString();
      const row = document.querySelector(
        `#tab-conduct tr[data-enrollment-id="${id}"]`,
      );
      if (!row) return;
      const marks = result.conductKeenness?.marks || [];
      marks.forEach((m) => {
        const input = row.querySelector(
          `.conduct-${m.evaluatorKey.replace("_", "-")}`,
        );
        if (input) input.value = m.marks;
      });
      const avg = result.conductKeenness?.average;
      if (avg !== null && avg !== undefined) {
        const avgInput = row.querySelector(".total-avg");
        if (avgInput) avgInput.value = avg;
      }
    });
  }

  function loadPracticalMarks() {
    if (!window.results || window.results.length === 0) return;
    window.results.forEach((r) => {
      const id = r.enrollmentId.toString();
      const midRow = document.querySelector(
        `#tab-practical-mid tr[data-enrollment-id="${id}"]`,
      );
      if (midRow && Array.isArray(r.practical?.midTerm)) {
        r.practical.midTerm.forEach((p, i) => {
          const inp = midRow.querySelector(`.pm-sub-${i + 1}`);
          if (inp && p.obtained != null) inp.value = p.obtained;
        });
        const total = r.practical.midTerm.reduce(
          (s, p) => s + (Number(p.obtained) || 0),
          0,
        );
        const totalInp = midRow.querySelector(".pm-total");
        if (totalInp) totalInp.value = total > 0 ? total : "";
      }
      const finRow = document.querySelector(
        `#tab-practical-final tr[data-enrollment-id="${id}"]`,
      );
      if (finRow && Array.isArray(r.practical?.finalTerm)) {
        r.practical.finalTerm.forEach((p, i) => {
          const inp = finRow.querySelector(`.pf-sub-${i + 1}`);
          if (inp && p.obtained != null) inp.value = p.obtained;
        });
        const total = r.practical.finalTerm.reduce(
          (s, p) => s + (Number(p.obtained) || 0),
          0,
        );
        const totalInp = finRow.querySelector(".pf-total");
        if (totalInp) totalInp.value = total > 0 ? total : "";
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
      [0, 1, 2, 3].forEach((i) => {
        if (subs[i]) {
          document.getElementById(`pfSub${i + 1}Title`).value = subs[i].title;
          document.getElementById(`pfSub${i + 1}Max`).value = subs[i].maxMarks;
          document.getElementById(`pfSub${i + 1}Min`).value = subs[i].minMarks;
          document.getElementById(`pfThSub${i + 1}`).childNodes[0].nodeValue =
            subs[i].title + " ";
          document.getElementById(`pfThSub${i + 1}MaxMin`).textContent =
            `(${String(subs[i].minMarks).padStart(2, "0")}/${String(subs[i].maxMarks).padStart(2, "0")})`;
        }
      });
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
  loadTheoryConfig();
  loadTheoryMarks();
  loadStudentMarks();
  loadPracticalMarks();
  loadPracticalConfig();

  // ═══════════ SAVE HANDLERS ═══════════

  // Conduct config
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
        } else alert(data.message || "Failed to save config");
      } catch (err) {
        alert("Error saving config.");
      } finally {
        btn.textContent = "Save Config";
        btn.disabled = false;
      }
    });

  // Theory Mid Config
  document
    .getElementById("saveTheoryMidConfigBtn")
    ?.addEventListener("click", async () => {
      const dataToSave = {
        term: "midTerm",
        examinerName: document.getElementById("tmExaminer").value,
        invigilatorName: document.getElementById("tmInvigilator").value,
        maxMarks: document.getElementById("tmMaxMarks").value,
        minMarks: document.getElementById("tmMinMarks").value,
      };
      try {
        const res = await fetch(
          `/course/${window.courseId}/result/theory-config`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSave),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Mid-Term Theory Config saved!");
          window.theoryConfig = data.data;
          loadTheoryConfig();
        } else alert(data.message);
      } catch (err) {
        alert("Error saving config");
      }
    });

  // Theory Final Config
  document
    .getElementById("saveTheoryFinalConfigBtn")
    ?.addEventListener("click", async () => {
      const dataToSave = {
        term: "finalTerm",
        examinerName: document.getElementById("tfExaminer").value,
        invigilatorName: document.getElementById("tfInvigilator").value,
        maxMarks: document.getElementById("tfMaxMarks").value,
        minMarks: document.getElementById("tfMinMarks").value,
      };
      try {
        const res = await fetch(
          `/course/${window.courseId}/result/theory-config`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSave),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Final-Term Theory Config saved!");
          window.theoryConfig = data.data;
          loadTheoryConfig();
        } else alert(data.message);
      } catch (err) {
        alert("Error saving config");
      }
    });

  // Practical configs
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

  // Theory Mid marks
  document
    .getElementById("saveTheoryMidBtn")
    ?.addEventListener("click", async () => {
      const rows = document.querySelectorAll(
        "#tab-theory-mid tbody tr[data-enrollment-id]",
      );
      const marksData = [];
      rows.forEach((row) => {
        const enrollmentId = row.dataset.enrollmentId;
        const val = row.querySelector(".tm-mark").value.trim();
        if (val !== "")
          marksData.push({
            enrollmentId,
            papers: [{ paperNo: 1, obtained: Number(val) }],
          });
      });
      if (marksData.length === 0) return alert("No marks entered to save.");
      const btn = document.getElementById("saveTheoryMidBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;
      try {
        const res = await fetch(
          `/course/${window.courseId}/result/theory-mid-marks`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marksData }),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Mid-Term marks saved!");
          window.location.reload();
        } else alert(data.message || "Failed to save");
      } catch (err) {
        alert("Error saving marks.");
      } finally {
        btn.textContent = "Save Mid-Term Marks";
        btn.disabled = false;
      }
    });

  // Theory Final marks
  document
    .getElementById("saveTheoryFinalBtn")
    ?.addEventListener("click", async () => {
      const rows = document.querySelectorAll(
        "#tab-theory-final tbody tr[data-enrollment-id]",
      );
      const hasP2 = !!document.querySelector(".tf-p2");
      const marksData = [];
      rows.forEach((row) => {
        const enrollmentId = row.dataset.enrollmentId;
        const papers = [];
        const p1 = row.querySelector(".tf-p1")?.value.trim();
        if (p1 !== "" && p1 !== undefined)
          papers.push({ paperNo: 1, obtained: Number(p1) });
        if (hasP2) {
          const p2 = row.querySelector(".tf-p2")?.value.trim();
          if (p2 !== "" && p2 !== undefined)
            papers.push({ paperNo: 2, obtained: Number(p2) });
        }
        if (papers.length > 0) marksData.push({ enrollmentId, papers });
      });
      if (marksData.length === 0) return alert("No marks entered to save.");
      const btn = document.getElementById("saveTheoryFinalBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;
      try {
        const res = await fetch(
          `/course/${window.courseId}/result/theory-final-marks`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marksData }),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Final-Term marks saved!");
          window.location.reload();
        } else alert(data.message || "Failed to save");
      } catch (err) {
        alert("Error saving marks.");
      } finally {
        btn.textContent = "Save Final-Term Marks";
        btn.disabled = false;
      }
    });

  // Conduct marks
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
        if (eval1 !== "" || eval2 !== "" || eval3 !== "")
          marksData.push({
            enrollmentId,
            eval_1: eval1,
            eval_2: eval2,
            eval_3: eval3,
          });
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
        } else alert(data.message || "Failed to save marks");
      } catch (err) {
        alert("Error saving marks.");
      } finally {
        btn.textContent = "Save Marks";
        btn.disabled = false;
      }
    });

  // Practical Mid marks
  document
    .getElementById("savePractMidBtn")
    ?.addEventListener("click", async () => {
      const rows = document.querySelectorAll(
        "#tab-practical-mid tbody tr[data-enrollment-id]",
      );
      const marksData = [];
      rows.forEach((row) => {
        const enrollmentId = row.dataset.enrollmentId;
        const marks = [];
        row.querySelectorAll(".pm-mark").forEach((inp, i) => {
          const val = inp.value.trim();
          if (val !== "") marks.push({ index: i, obtained: Number(val) });
        });
        if (marks.length > 0) marksData.push({ enrollmentId, marks });
      });
      if (marksData.length === 0) return alert("No marks entered to save.");
      const btn = document.getElementById("savePractMidBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;
      try {
        const res = await fetch(
          `/course/${window.courseId}/result/practical-mid-marks`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marksData }),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Mid-Term marks saved!");
          window.location.reload();
        } else alert(data.message || "Failed to save");
      } catch (err) {
        alert("Error saving marks.");
      } finally {
        btn.textContent = "Save Mid-Term Marks";
        btn.disabled = false;
      }
    });

  // Practical Final marks
  document
    .getElementById("savePractFinalBtn")
    ?.addEventListener("click", async () => {
      const rows = document.querySelectorAll(
        "#tab-practical-final tbody tr[data-enrollment-id]",
      );
      const marksData = [];
      rows.forEach((row) => {
        const enrollmentId = row.dataset.enrollmentId;
        const marks = [];
        row.querySelectorAll(".pf-mark").forEach((inp, i) => {
          const val = inp.value.trim();
          if (val !== "") marks.push({ index: i, obtained: Number(val) });
        });
        if (marks.length > 0) marksData.push({ enrollmentId, marks });
      });
      if (marksData.length === 0) return alert("No marks entered to save.");
      const btn = document.getElementById("savePractFinalBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;
      try {
        const res = await fetch(
          `/course/${window.courseId}/result/practical-final-marks`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ marksData }),
          },
        );
        const data = await res.json();
        if (data.success) {
          alert("Final-Term marks saved!");
          window.location.reload();
        } else alert(data.message || "Failed to save");
      } catch (err) {
        alert("Error saving marks.");
      } finally {
        btn.textContent = "Save Final-Term Marks";
        btn.disabled = false;
      }
    });

  // ═══════════ LIVE INPUT VALIDATION ═══════════

  document
    .getElementById("tmMaxMarks")
    ?.addEventListener("input", updateTheoryMidHeader);
  document
    .getElementById("tmMinMarks")
    ?.addEventListener("input", updateTheoryMidHeader);
  document
    .getElementById("tfMaxMarks")
    ?.addEventListener("input", updateTheoryFinalHeader);
  document
    .getElementById("tfMinMarks")
    ?.addEventListener("input", updateTheoryFinalHeader);

  const theoryMidTable = document.getElementById("tab-theory-mid");
  if (theoryMidTable) {
    theoryMidTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("tm-mark")) {
        const max = Number(window.theoryConfig?.midTerm?.maxMarks) || 100;
        if (e.target.value !== "" && Number(e.target.value) > max) {
          alert(`Marks cannot exceed ${max}`);
          e.target.value = "";
        }
      }
    });
  }

  const theoryFinalTable = document.getElementById("tab-theory-final");
  if (theoryFinalTable) {
    theoryFinalTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("tf-mark")) {
        const max = Number(window.theoryConfig?.finalTerm?.maxMarks) || 100;
        if (e.target.value !== "" && Number(e.target.value) > max) {
          alert(`Marks cannot exceed ${max}`);
          e.target.value = "";
        }
      }
    });
  }

  const practMidTable = document.getElementById("tab-practical-mid");
  if (practMidTable) {
    practMidTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("pm-mark")) {
        const row = e.target.closest("tr");
        const inputs = row.querySelectorAll(".pm-mark");
        const idx = Array.from(inputs).indexOf(e.target);
        const maxMarks = Number(
          window.practicalConfig?.midTerm?.subjects?.[idx]?.maxMarks,
        );
        if (
          !isNaN(maxMarks) &&
          e.target.value !== "" &&
          Number(e.target.value) > maxMarks
        ) {
          alert(`Marks cannot exceed ${maxMarks}`);
          e.target.value = "";
          return;
        }
        const marks = Array.from(inputs).map(
          (inp) => parseFloat(inp.value) || 0,
        );
        row.querySelector(".pm-total").value = marks.some((m) => m > 0)
          ? marks.reduce((a, b) => a + b, 0)
          : "";
      }
    });
  }

  const practFinalTable = document.getElementById("tab-practical-final");
  if (practFinalTable) {
    practFinalTable.addEventListener("input", (e) => {
      if (e.target.classList.contains("pf-mark")) {
        const row = e.target.closest("tr");
        const inputs = row.querySelectorAll(".pf-mark");
        const idx = Array.from(inputs).indexOf(e.target);
        const maxMarks = Number(
          window.practicalConfig?.finalTerm?.subjects?.[idx]?.maxMarks,
        );
        if (
          !isNaN(maxMarks) &&
          e.target.value !== "" &&
          Number(e.target.value) > maxMarks
        ) {
          alert(`Marks cannot exceed ${maxMarks}`);
          e.target.value = "";
          return;
        }
        const marks = Array.from(inputs).map(
          (inp) => parseFloat(inp.value) || 0,
        );
        row.querySelector(".pf-total").value = marks.some((m) => m > 0)
          ? marks.reduce((a, b) => a + b, 0)
          : "";
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
        row.querySelector(".total-avg").value = marks.some((m) => m > 0)
          ? (marks.reduce((a, b) => a + b, 0) / 3).toFixed(2)
          : "";
      }
    });
  }

  // Enter key nav
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
