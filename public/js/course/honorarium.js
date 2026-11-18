document.addEventListener("DOMContentLoaded", () => {
  // ═════════ Modal Elements (Refs) ═════════
  // 1. Practical
  const practicalModal = document.getElementById("practical-modal");
  const closePracticalModalBtn = document.getElementById(
    "close-practical-modal",
  );
  const cancelPracticalBtn = document.getElementById("cancel-practical-btn");
  const practicalForm = document.getElementById("practical-form");
  const submitPracticalBtn = document.getElementById("submit-practical-btn");
  const practicalNameInput = document.getElementById("practical-name");
  const practicalRankInput = document.getElementById("practical-rank");
  const practicalAddressInput = document.getElementById("practical-address");

  // 2. Exam
  const examModal = document.getElementById("exam-modal");
  const examModalTitle = document.getElementById("exam-modal-title");
  const closeExamModalBtn = document.getElementById("close-exam-modal");
  const cancelExamBtn = document.getElementById("cancel-exam-btn");
  const examForm = document.getElementById("exam-form");
  const examRoleInput = document.getElementById("exam-role");
  const examTypeSelect = document.getElementById("exam-type-select");
  const examFacultySelect = document.getElementById("exam-faculty-select");
  const examNameInput = document.getElementById("exam-name");
  const examRankInput = document.getElementById("exam-rank");
  const examAddressInput = document.getElementById("exam-address");
  const submitExamBtn = document.getElementById("submit-exam-btn");

  // 3. Theory
  const theoryModal = document.getElementById("theory-modal");
  const closeTheoryModalBtn = document.getElementById("close-theory-modal");
  const cancelTheoryBtn = document.getElementById("cancel-theory-btn");
  const theoryForm = document.getElementById("theory-form");
  const submitTheoryBtn = document.getElementById("submit-theory-btn");
  const theorySelect = document.getElementById("theory-select");
  const theoryTitleInput = document.getElementById("theory-title");
  const theoryNameInput = document.getElementById("theory-name");
  const theoryRankInput = document.getElementById("theory-rank");
  const theoryAddressInput = document.getElementById("theory-address");
  const theorySessionsInput = document.getElementById("theory-sessions");

  // 4. Travel
  const travelModal = document.getElementById("travel-modal");
  const closeTravelModalBtn = document.getElementById("close-travel-modal");
  const cancelTravelBtn = document.getElementById("cancel-travel-btn");
  const travelForm = document.getElementById("travel-form");
  const submitTravelBtn = document.getElementById("submit-travel-btn");
  const travelVisitType = document.getElementById("travel-visit-type");

  const travelTheoryWrapper = document.getElementById("travel-theory-wrapper");
  const travelTheorySelect = document.getElementById("travel-theory-select");
  const travelExamWrapper = document.getElementById("travel-exam-wrapper");
  const travelExamFacultySelect = document.getElementById(
    "travel-exam-faculty-select",
  );

  const travelLectureTitle = document.getElementById("travel-lecture-title");
  const travelNameInput = document.getElementById("travel-name");
  const travelRankInput = document.getElementById("travel-rank");
  const travelAddressInput = document.getElementById("travel-address");
  const travelDistanceInput = document.getElementById("travel-distance");

  // ═════════ Helper Functions ═════════
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  // ═════════ Fetch & Load Data ═════════
  let allFaculties = [];
  async function loadFaculties() {
    try {
      const res = await fetch("/faculty/api/list");
      const data = await res.json();
      if (data.success) {
        allFaculties = data.faculties || [];
      }
    } catch (err) {
      console.error("Failed to load faculties for dropdown:", err);
    }
  }

  function populateFacultyDropdown(selectEl) {
    selectEl.innerHTML = `<option value="" disabled selected>-- Select Faculty --</option>`;
    allFaculties.forEach((fac) => {
      const opt = document.createElement("option");
      opt.value = fac._id;
      opt.textContent = `${fac.name} ${fac.rank ? `(${fac.rank})` : ""}`;
      opt.dataset.name = fac.name || "";
      opt.dataset.rank = fac.rank || "";
      opt.dataset.address = fac.address || "";
      selectEl.appendChild(opt);
    });
  }

  let cachedTheoryLectures = null;
  async function loadTheoryLectures(selectEl) {
    try {
      selectEl.innerHTML = `<option value="" disabled selected>Loading...</option>`;

      if (!cachedTheoryLectures) {
        const res = await fetch(
          `/course/${window.courseId}/honorarium/get-theory-lectures`,
        );
        const data = await res.json();
        if (data.success) {
          cachedTheoryLectures = data.lectures;
        }
      }

      if (cachedTheoryLectures && cachedTheoryLectures.length > 0) {
        selectEl.innerHTML = `<option value="" disabled selected>-- Select Lecture --</option>`;
        cachedTheoryLectures.forEach((lec, index) => {
          const opt = document.createElement("option");
          opt.value = index;

          // ✅ SMART FALLBACK: Agar backend se format nahi aaya, toh JS khud banayega
          const displayDate =
            lec.displayDate ||
            (lec.date ? new Date(lec.date).toLocaleDateString("en-GB") : "");
          const label =
            lec.format ||
            `${lec.title} by ${lec.name} (${String(lec.count).padStart(2, "0")} session${lec.count > 1 ? "s" : ""} - ${displayDate})`;

          opt.textContent = label;
          opt.dataset.title = lec.title || "";
          opt.dataset.name = lec.name || "";
          opt.dataset.rank = lec.rank || "";
          opt.dataset.address = lec.address || "";
          opt.dataset.count = lec.count || "";
          opt.dataset.date = lec.date || ""; // Frontend se backend ko actual date bhejne ke liye
          selectEl.appendChild(opt);
        });
      } else {
        selectEl.innerHTML = `<option value="" disabled selected>No theory lectures found</option>`;
      }
    } catch (err) {
      console.error("Error loading theory lectures:", err);
      selectEl.innerHTML = `<option value="" disabled selected>Error loading data</option>`;
    }
  }

  // ═════════ Auto-fill Events ═════════
  theorySelect.addEventListener("change", function () {
    const selectedOpt = this.options[this.selectedIndex];
    if (!selectedOpt || !selectedOpt.value) return;
    theoryTitleInput.value = selectedOpt.dataset.title || "";
    theoryNameInput.value = selectedOpt.dataset.name || "";
    theoryRankInput.value = selectedOpt.dataset.rank || "";
    theoryAddressInput.value = selectedOpt.dataset.address || "";
    theorySessionsInput.value = selectedOpt.dataset.count || "";
  });

  travelTheorySelect.addEventListener("change", function () {
    const selectedOpt = this.options[this.selectedIndex];
    if (!selectedOpt || !selectedOpt.value) return;
    travelLectureTitle.value = selectedOpt.dataset.title || "";
    travelNameInput.value = selectedOpt.dataset.name || "";
    travelRankInput.value = selectedOpt.dataset.rank || "";
    travelAddressInput.value = selectedOpt.dataset.address || "";
  });

  examFacultySelect.addEventListener("change", function () {
    const selectedOpt = this.options[this.selectedIndex];
    if (!selectedOpt || !selectedOpt.value) return;
    examNameInput.value = selectedOpt.dataset.name || "";
    examRankInput.value = selectedOpt.dataset.rank || "";
    examAddressInput.value = selectedOpt.dataset.address || "";
  });

  travelExamFacultySelect.addEventListener("change", function () {
    const selectedOpt = this.options[this.selectedIndex];
    if (!selectedOpt || !selectedOpt.value) return;
    travelNameInput.value = selectedOpt.dataset.name || "";
    travelRankInput.value = selectedOpt.dataset.rank || "";
    travelAddressInput.value = selectedOpt.dataset.address || "";
  });

  // ═════════ Dynamic Fields Logic (Travel) ═════════
  travelVisitType.addEventListener("change", function () {
    const type = this.value;

    travelNameInput.value = "";
    travelRankInput.value = "";
    travelAddressInput.value = "";
    travelLectureTitle.value = "";

    travelTheoryWrapper.style.display = "none";
    travelExamWrapper.style.display = "none";

    if (type === "theory") {
      travelTheoryWrapper.style.display = "block";
      loadTheoryLectures(travelTheorySelect);
    } else if (type === "final" || type === "mid") {
      travelExamWrapper.style.display = "block";
      populateFacultyDropdown(travelExamFacultySelect);
    }
  });

  // ═════════ Card Button Handlers ═════════
  const actionCards = document.querySelectorAll(".action-card");
  actionCards.forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.dataset.action;

      switch (action) {
        case "practical":
          openModal(practicalModal);
          break;
        case "theory":
          loadTheoryLectures(theorySelect);
          openModal(theoryModal);
          break;
        case "examiner":
          examRoleInput.value = "examiner";
          examModalTitle.textContent = "Examiner Honorarium Details";
          populateFacultyDropdown(examFacultySelect);
          openModal(examModal);
          break;
        case "invigilator":
          examRoleInput.value = "invigilator";
          examModalTitle.textContent = "Invigilator Honorarium Details";
          populateFacultyDropdown(examFacultySelect);
          openModal(examModal);
          break;
        case "travel":
          travelVisitType.value = "";
          travelTheoryWrapper.style.display = "none";
          travelExamWrapper.style.display = "none";
          openModal(travelModal);
          break;
        default:
          console.warn("Unknown action:", action);
      }
    });
  });

  // ═════════ Close Modals Logic ═════════
  function closePracticalModal() {
    closeModal(practicalModal);
    practicalForm.reset();
  }
  closePracticalModalBtn.addEventListener("click", closePracticalModal);
  cancelPracticalBtn.addEventListener("click", closePracticalModal);
  practicalModal.addEventListener("click", (e) => {
    if (e.target === practicalModal) closePracticalModal();
  });

  function closeExamModal() {
    closeModal(examModal);
    examForm.reset();
  }
  closeExamModalBtn.addEventListener("click", closeExamModal);
  cancelExamBtn.addEventListener("click", closeExamModal);
  examModal.addEventListener("click", (e) => {
    if (e.target === examModal) closeExamModal();
  });

  function closeTheoryModal() {
    closeModal(theoryModal);
    theoryForm.reset();
  }
  closeTheoryModalBtn.addEventListener("click", closeTheoryModal);
  cancelTheoryBtn.addEventListener("click", closeTheoryModal);
  theoryModal.addEventListener("click", (e) => {
    if (e.target === theoryModal) closeTheoryModal();
  });

  function closeTravelModal() {
    closeModal(travelModal);
    travelForm.reset();
    travelTheoryWrapper.style.display = "none";
    travelExamWrapper.style.display = "none";
    travelLectureTitle.value = "";
  }
  closeTravelModalBtn.addEventListener("click", closeTravelModal);
  cancelTravelBtn.addEventListener("click", closeTravelModal);
  travelModal.addEventListener("click", (e) => {
    if (e.target === travelModal) closeTravelModal();
  });

  // ═════════ ESC key to close modals ═════════
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (practicalModal.classList.contains("active")) closePracticalModal();
      if (examModal.classList.contains("active")) closeExamModal();
      if (theoryModal.classList.contains("active")) closeTheoryModal();
      if (travelModal.classList.contains("active")) closeTravelModal();
    }
  });

  // ═════════ Submit Handlers ═════════
  practicalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = practicalNameInput.value.trim();
    const rank = practicalRankInput.value.trim();
    const address = practicalAddressInput.value.trim();
    if (!name || !rank || !address) return alert("Please fill all fields");

    submitPracticalBtn.disabled = true;
    submitPracticalBtn.textContent = "Generating...";
    try {
      const res = await fetch(
        `/course/${window.courseId}/honorarium/practical`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, rank, address }),
        },
      );
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "PracticalHonorarium.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      closePracticalModal();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      submitPracticalBtn.disabled = false;
      submitPracticalBtn.textContent = "Generate PDF";
    }
  });

  examForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = examRoleInput.value;
    const examType = examTypeSelect.value;
    const name = examNameInput.value.trim();
    const rank = examRankInput.value.trim();
    const address = examAddressInput.value.trim();
    if (!examType || !name || !rank || !address)
      return alert("Please fill all fields");

    submitExamBtn.disabled = true;
    submitExamBtn.textContent = "Generating...";
    try {
      const res = await fetch(`/course/${window.courseId}/honorarium/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, name, rank, address }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${role}_honorarium.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      closeExamModal();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      submitExamBtn.disabled = false;
      submitExamBtn.textContent = "Generate PDF";
    }
  });

  theoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = theoryTitleInput.value.trim();
    const name = theoryNameInput.value.trim();
    const rank = theoryRankInput.value.trim();
    const address = theoryAddressInput.value.trim();
    const sessions = theorySessionsInput.value;
    const selectedOpt = theorySelect.options[theorySelect.selectedIndex];
    const date = selectedOpt ? selectedOpt.dataset.date : "";

    if (!title || !name || !rank || !address || !sessions)
      return alert("Please fill all fields");

    submitTheoryBtn.disabled = true;
    submitTheoryBtn.textContent = "Generating...";
    try {
      const res = await fetch(`/course/${window.courseId}/honorarium/theory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, name, rank, address, sessions, date }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TheoryHonorarium.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      closeTheoryModal();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      submitTheoryBtn.disabled = false;
      submitTheoryBtn.textContent = "Generate PDF";
    }
  });

  travelForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const visitType = travelVisitType.value;
    const name = travelNameInput.value.trim();
    const rank = travelRankInput.value.trim();
    const address = travelAddressInput.value.trim();
    const distance = travelDistanceInput.value;
    const lectureTitle = travelLectureTitle.value.trim();

    if (!visitType || !name || !rank || !address || !distance) {
      return alert("Please fill all fields");
    }

    submitTravelBtn.disabled = true;
    submitTravelBtn.textContent = "Generating...";

    try {
      const res = await fetch(`/course/${window.courseId}/honorarium/travel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitType,
          name,
          rank,
          address,
          distance,
          lectureTitle,
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TravelAllowance.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      closeTravelModal();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      submitTravelBtn.disabled = false;
      submitTravelBtn.textContent = "Generate PDF";
    }
  });

  // ═════════ Initialization ═════════
  loadFaculties();
});
