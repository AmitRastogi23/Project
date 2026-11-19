pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

document.addEventListener("DOMContentLoaded", function () {
  const weekBtns = document.querySelectorAll(".week-btn");
  const weekContents = document.querySelectorAll(".week-content");
  const dayTabs = document.querySelectorAll(".day-tab");
  const dayContents = document.querySelectorAll(".day-content");
  const modal = document.getElementById("classModal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const classForm = document.getElementById("classForm");
  const typeOptions = document.querySelectorAll(".type-option");
  const classTypeInput = document.getElementById("classType");
  const extraFields = document.getElementById("extraFields");
  const visitLocationGroup = document.getElementById("visitLocationGroup");
  const visitLocationInput = document.getElementById("visitLocation");

  const deleteConfirmModal = document.getElementById("deleteConfirmModal");
  const closeDeleteModal = document.getElementById("closeDeleteModal");
  const cancelDelete = document.getElementById("cancelDelete");
  const confirmDelete = document.getElementById("confirmDelete");
  let sessionToDelete = null;

  const previewPdfBtn = document.getElementById("previewPdfBtn");
  const pdfPreviewModal = document.getElementById("pdfPreviewModal");

  const docSupportModal = document.getElementById("docSupportModal");
  const closeDocSupportModalBtn = document.getElementById(
    "closeDocSupportModal",
  );
  const cancelDocSupportBtn = document.getElementById("cancelDocSupport");
  const docSupportForm = document.getElementById("docSupportForm");
  const docSupportWeekIndexInput = document.getElementById(
    "docSupportWeekIndex",
  );
  const docSupportInput1 = document.getElementById("docSupportInput1");
  const docSupportInput2 = document.getElementById("docSupportInput2");
  const saveDocSupportBtn = document.getElementById("saveDocSupport");

  const holidays = window.holidays || [];

  function isHoliday(dateStr) {
    if (!holidays || holidays.length === 0) return false;
    const d = new Date(dateStr);
    return holidays.some(function (h) {
      const hd = new Date(h.date);
      return (
        hd.getFullYear() === d.getFullYear() &&
        hd.getMonth() === d.getMonth() &&
        hd.getDate() === d.getDate()
      );
    });
  }

  function getDefaultSessionTitle(type) {
    const titles = {
      SQUAD_DRILL: "Squad Drill",
      ROLL_CALL: "Roll Call",
      LUNCH: "Lunch Break",
      BREAK: "Break",
      GAMES: "Games",
      MAINTENANCE: "Maintenance",
      MID_TERM: "MID-TERM PRACTICAL & Theory EXAMINATION",
      FINAL_TERM: "FINAL-TERM PRACTICAL & Theory EXAMINATION",
      VALEDICTORY_FUNCTION: "Valedictory Function",
      INSTRUCTIONAL_VISIT: "Instructional Visit",
    };
    return titles[type] || "";
  }

  // ═════════ Build a session-item DOM node from a session object ═════════
  function buildSessionItem(session) {
    const div = document.createElement("div");
    div.className = "session-item";
    div.dataset.sessionId = session._id;

    const facultyDisplay =
      typeof session.faculty === "string"
        ? session.faculty
        : (session.faculty && session.faculty.name) || "";

    const facultyValue =
      typeof session.faculty === "object" &&
      session.faculty &&
      session.faculty._id
        ? session.faculty._id
        : session.faculty || "";

    div.innerHTML = `
      <div class="session-time">
        <span class="start">${session.startTime}</span>
        <span class="separator">-</span>
        <span class="end">${session.endTime}</span>
      </div>
      <div class="session-type ${session.type.toLowerCase()}">
        ${session.type.replace(/_/g, " ")}
      </div>
      ${session.title ? `<div class="session-title">${session.title}</div>` : ""}
      ${
        facultyDisplay
          ? `
        <div class="session-faculty" data-faculty-value="${facultyValue}">
          <span class="label">Faculty:</span> ${facultyDisplay}
        </div>`
          : ""
      }
      ${
        session.type === "INSTRUCTIONAL_VISIT" && session.location
          ? `
        <div class="session-location">
          <span class="label">Location:</span> ${session.location}
        </div>`
          : ""
      }
      <div class="session-actions">
        <button type="button" class="edit-session-btn" title="Edit Session">✏️</button>
        <button type="button" class="delete-session-btn" title="Delete Session">🗑️</button>
      </div>
    `;
    return div;
  }

  function sortSessionsInDay(dayEl) {
    const list = dayEl.querySelector(".sessions-list");
    if (!list) return;
    const items = Array.from(list.querySelectorAll(".session-item"));
    items.sort((a, b) => {
      const sa = a.querySelector(".start")?.textContent.trim() || "";
      const sb = b.querySelector(".start")?.textContent.trim() || "";
      return sa.localeCompare(sb);
    });
    items.forEach((it) => list.appendChild(it));
  }

  // ═════════ Week Tabs ═════════
  weekBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      weekBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const weekIndex = this.dataset.weekIndex;
      weekContents.forEach((content, index) => {
        content.classList.toggle("active", index == weekIndex);
      });
      const firstDayTab = document.querySelector(
        `.day-tab[data-week-index="${weekIndex}"]`,
      );
      if (firstDayTab) {
        document
          .querySelectorAll(`.day-tab[data-week-index="${weekIndex}"]`)
          .forEach((t) => t.classList.remove("active"));
        firstDayTab.classList.add("active");
        document
          .querySelectorAll(`.day-content[id^="day-${weekIndex}-"]`)
          .forEach((c) => c.classList.remove("active"));
        const firstDayContent = document.getElementById(`day-${weekIndex}-0`);
        if (firstDayContent) firstDayContent.classList.add("active");
      }
    });
  });

  // ═════════ Day Tabs ═════════
  dayTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const weekIndex = this.dataset.weekIndex;
      const dayIndex = this.dataset.dayIndex;
      document
        .querySelectorAll(`.day-tab[data-week-index="${weekIndex}"]`)
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      document
        .querySelectorAll(`.day-content[id^="day-${weekIndex}-"]`)
        .forEach((c) => c.classList.remove("active"));
      const target = document.getElementById(`day-${weekIndex}-${dayIndex}`);
      if (target) target.classList.add("active");
    });
  });

  // ═════════ Session Type Selector ═════════
  typeOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      typeOptions.forEach((opt) => opt.classList.remove("active"));
      this.classList.add("active");
      const selectedType = this.dataset.type;
      classTypeInput.value = selectedType;

      if (["PRACTICAL", "THEORY", "OTHER"].includes(selectedType)) {
        extraFields.style.display = "block";
      } else {
        extraFields.style.display = "none";
        document.getElementById("classTitle").value = "";
        document.getElementById("classFaculty").value = "";
      }

      if (selectedType === "INSTRUCTIONAL_VISIT") {
        visitLocationGroup.style.display = "block";
      } else {
        visitLocationGroup.style.display = "none";
        visitLocationInput.value = "";
      }
    });
  });

  let currentWeekIndex = "";
  let currentDayIndex = "";
  let currentSessionId = null;

  function openModal(week, day, date, weekIndex, dayIndex) {
    if (isHoliday(date)) {
      alert("This day is a holiday! Cannot add session.");
      return;
    }
    currentWeekIndex = weekIndex;
    currentDayIndex = dayIndex;
    currentSessionId = null;
    modal.classList.add("active");
    document.body.classList.add("modal-open");
    typeOptions.forEach((opt) => opt.classList.remove("active"));
    extraFields.style.display = "none";
    classTypeInput.value = "";
    document.getElementById("classTitle").value = "";
    document.getElementById("classFaculty").value = "";
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
    visitLocationGroup.style.display = "none";
    visitLocationInput.value = "";
  }

  function openEditModal(sessionItem) {
    const sessionId = sessionItem.dataset.sessionId;
    currentSessionId = sessionId;
    currentWeekIndex = sessionItem.closest(".day-content").id.split("-")[1];
    currentDayIndex = sessionItem.closest(".day-content").id.split("-")[2];

    const startTime = sessionItem
      .querySelector(".session-time .start")
      .textContent.trim();
    const endTime = sessionItem
      .querySelector(".session-time .end")
      .textContent.trim();
    const type = sessionItem
      .querySelector(".session-type")
      .textContent.trim()
      .replace(/ /g, "_")
      .toUpperCase();
    const titleEl = sessionItem.querySelector(".session-title");
    const title = titleEl ? titleEl.textContent.trim() : "";
    const locEl = sessionItem.querySelector(".session-location");
    const location = locEl
      ? locEl.textContent.replace("Location:", "").trim()
      : "";

    document.getElementById("startTime").value = startTime;
    document.getElementById("endTime").value = endTime;
    document.getElementById("classTitle").value = title;
    visitLocationInput.value = location;

    const facEl = sessionItem.querySelector(".session-faculty");
    if (facEl) {
      const v = facEl.dataset.facultyValue;
      if (v) document.getElementById("classFaculty").value = v;
    }

    typeOptions.forEach((option) => {
      option.classList.toggle("active", option.dataset.type === type);
    });
    classTypeInput.value = type;

    extraFields.style.display = ["PRACTICAL", "THEORY"].includes(type)
      ? "block"
      : "none";
    visitLocationGroup.style.display =
      type === "INSTRUCTIONAL_VISIT" ? "block" : "none";

    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function openDeleteConfirm(sessionItem) {
    sessionToDelete = sessionItem.dataset.sessionId;
    deleteConfirmModal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  // ═════════ Event Delegation for edit/delete buttons ═════════
  document.querySelectorAll(".sessions-list").forEach((list) => {
    list.addEventListener("click", function (e) {
      const editBtn = e.target.closest(".edit-session-btn");
      const delBtn = e.target.closest(".delete-session-btn");
      if (editBtn) openEditModal(editBtn.closest(".session-item"));
      if (delBtn) openDeleteConfirm(delBtn.closest(".session-item"));
    });
  });

  // ═════════ Delete confirm modal ═════════
  function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
  closeDeleteModal.addEventListener("click", closeDeleteConfirmModal);
  cancelDelete.addEventListener("click", closeDeleteConfirmModal);
  deleteConfirmModal.addEventListener("click", function (e) {
    if (e.target === this) closeDeleteConfirmModal();
  });

  confirmDelete.addEventListener("click", async function () {
    if (!sessionToDelete) return;
    try {
      const response = await fetch(
        `${window.location.pathname}/session/${sessionToDelete}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        const item = document.querySelector(
          `.session-item[data-session-id="${sessionToDelete}"]`,
        );
        if (item) item.remove();
        sessionToDelete = null;
        closeDeleteConfirmModal();
      } else {
        alert(result.message || "Failed to delete session");
      }
    } catch (error) {
      alert("Error deleting session: " + error.message);
    }
  });

  // ═════════ Add Session button ═════════
  document.querySelectorAll(".add-session-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(
        this.dataset.week,
        this.dataset.day,
        this.dataset.date,
        this.dataset.weekIndex,
        this.dataset.dayIndex,
      );
    });
  });

  function closeModal() {
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
    classForm.reset();
    typeOptions.forEach((opt) => opt.classList.remove("active"));
    extraFields.style.display = "none";
    classTypeInput.value = "";
  }
  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

  classForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const type = classTypeInput.value;
    if (!type) return alert("Please select a session type");

    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    if (!startTime || !endTime)
      return alert("Please select start and end time");

    let title = "";
    let faculty = "";

    if (type === "REVISION") {
      title = "Revision";
    } else if (type === "OTHER") {
      title = document.getElementById("classTitle").value;
      faculty = document.getElementById("classFaculty").value;
    } else {
      title =
        getDefaultSessionTitle(type) ||
        document.getElementById("classTitle").value;
      faculty = document.getElementById("classFaculty").value;
    }

    const data = {
      weekIndex: currentWeekIndex,
      dayIndex: currentDayIndex,
      startTime,
      endTime,
      type,
      title,
      faculty,
      location: visitLocationInput.value,
    };

    let url = window.location.pathname;
    let method = "POST";
    if (currentSessionId) {
      url = `${window.location.pathname}/session/${currentSessionId}`;
      method = "PUT";
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!result.success)
        return alert(result.message || "Failed to save session");

      const dayEl = document.getElementById(
        `day-${currentWeekIndex}-${currentDayIndex}`,
      );
      if (dayEl) {
        const list = dayEl.querySelector(".sessions-list");
        if (currentSessionId) {
          const existing = dayEl.querySelector(
            `.session-item[data-session-id="${currentSessionId}"]`,
          );
          if (existing) existing.replaceWith(buildSessionItem(result.session));
          else list.appendChild(buildSessionItem(result.session));
        } else {
          if (list) {
            list.appendChild(buildSessionItem(result.session));
          } else {
            // was an empty/holiday-free day with no sessions-list — simplest: reload once
            location.reload();
            return;
          }
        }
        sortSessionsInDay(dayEl);
      }

      currentSessionId = null;
      closeModal();
    } catch (error) {
      alert("Error saving session: " + error.message);
    }
  });

  // ═════════ Doc Support ═════════
  document.querySelectorAll(".edit-doc-support-btn").forEach(function (btn) {
    btn.addEventListener("click", async function () {
      const weekIndex = this.dataset.weekIndex;
      docSupportWeekIndexInput.value = weekIndex;
      docSupportInput1.value = "";
      docSupportInput2.value = "";
      saveDocSupportBtn.disabled = true;
      saveDocSupportBtn.textContent = "Loading...";

      try {
        const res = await fetch(
          `/course/${window.courseId}/schedule/week/${weekIndex}/docSupport`,
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch");
        docSupportInput1.value = data.docSupport1 || "";
        docSupportInput2.value = data.docSupport2 || "";
        saveDocSupportBtn.disabled = false;
        saveDocSupportBtn.textContent = "Save";
        docSupportModal.classList.add("active");
        document.body.classList.add("modal-open");
      } catch (err) {
        alert("Failed to load documentation support data.");
        saveDocSupportBtn.disabled = false;
        saveDocSupportBtn.textContent = "Save";
      }
    });
  });

  function closeDocSupport() {
    docSupportModal.classList.remove("active");
    document.body.classList.remove("modal-open");
    docSupportForm.reset();
  }
  closeDocSupportModalBtn.addEventListener("click", closeDocSupport);
  cancelDocSupportBtn.addEventListener("click", closeDocSupport);
  docSupportModal.addEventListener("click", function (e) {
    if (e.target === docSupportModal) closeDocSupport();
  });

  docSupportForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const weekIndex = docSupportWeekIndexInput.value;
    const docSupport1 = docSupportInput1.value.trim();
    const docSupport2 = docSupportInput2.value.trim();
    saveDocSupportBtn.disabled = true;
    saveDocSupportBtn.textContent = "Saving...";

    try {
      const res = await fetch(
        `/course/${window.courseId}/schedule/week/${weekIndex}/docSupport`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docSupport1, docSupport2 }),
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save");

      const namesSpan = document.getElementById(`docSupportNames-${weekIndex}`);
      if (namesSpan) {
        const parts = [];
        if (docSupport1) parts.push(docSupport1);
        if (docSupport2) parts.push(docSupport2);
        namesSpan.textContent = parts.length > 0 ? parts.join(", ") : "Not set";
      }
      closeDocSupport();
    } catch (err) {
      alert("Failed to save: " + err.message);
      saveDocSupportBtn.disabled = false;
      saveDocSupportBtn.textContent = "Save";
    }
  });

  // ═════════ PDF Preview ═════════
  previewPdfBtn.addEventListener("click", function () {
    pdfPreviewModal.classList.add("active");
    document.body.classList.add("modal-open");
    loadPdfPreview();
  });
  const closePdfPreview = document.getElementById("closePdfPreview");
  const cancelPdfPreview = document.getElementById("cancelPdfPreview");
  function closePdfModal() {
    pdfPreviewModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
  closePdfPreview.addEventListener("click", closePdfModal);
  cancelPdfPreview.addEventListener("click", closePdfModal);

  async function loadPdfPreview() {
    const body = document.getElementById("pdfPreviewBody");
    body.innerHTML = `<div class="loading-text">Loading PDF preview...</div>`;
    try {
      const response = await fetch(
        `/course/${window.courseId}/schedule/preview`,
      );
      if (!response.ok) throw new Error("PDF fetch failed");
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      body.innerHTML = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = "block";
        canvas.style.maxWidth = "100%";
        canvas.style.height = "auto";
        canvas.style.margin = "0 auto 20px";
        body.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    } catch (error) {
      body.innerHTML = `<div class="loading-text" style="color:#b42318;">Failed to load PDF preview.</div>`;
    }
  }
});
