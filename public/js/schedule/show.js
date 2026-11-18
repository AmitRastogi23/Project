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

  // ═════════ Documentation Support Modal Refs ═════════
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

  var holidays = [];
  if (holidays && holidays.length > 0) {
    const holidayData = JSON.stringify(holidays);
    holidays = holidayData;
  }

  function isHoliday(dateStr) {
    if (!holidays || holidays.length === 0) return false;
    const dateObj = new Date(dateStr);
    return holidays.some(function (h) {
      const hDate = new Date(h.date);
      return (
        hDate.getFullYear() === dateObj.getFullYear() &&
        hDate.getMonth() === dateObj.getMonth() &&
        hDate.getDate() === dateObj.getDate()
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

  // ═════════ Week Tabs ═════════
  weekBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      weekBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      this.classList.add("active");
      var weekIndex = this.dataset.weekIndex;
      weekContents.forEach(function (content, index) {
        if (index == weekIndex) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
      var firstDayTab = document.querySelector(
        '.day-tab[data-week-index="' + weekIndex + '"]',
      );
      if (firstDayTab) {
        document
          .querySelectorAll('.day-tab[data-week-index="' + weekIndex + '"]')
          .forEach(function (tab) {
            tab.classList.remove("active");
          });
        firstDayTab.classList.add("active");
        document
          .querySelectorAll('.day-content[id^="day-' + weekIndex + '-"]')
          .forEach(function (content) {
            content.classList.remove("active");
          });
        var firstDayContent = document.getElementById(
          "day-" + weekIndex + "-0",
        );
        if (firstDayContent) firstDayContent.classList.add("active");
      }
    });
  });

  // ═════════ Day Tabs ═════════
  dayTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var weekIndex = this.dataset.weekIndex;
      var dayIndex = this.dataset.dayIndex;
      document
        .querySelectorAll('.day-tab[data-week-index="' + weekIndex + '"]')
        .forEach(function (t) {
          t.classList.remove("active");
        });
      this.classList.add("active");
      document
        .querySelectorAll('.day-content[id^="day-' + weekIndex + '-"]')
        .forEach(function (content) {
          content.classList.remove("active");
        });
      var targetContent = document.getElementById(
        "day-" + weekIndex + "-" + dayIndex,
      );
      if (targetContent) targetContent.classList.add("active");
    });
  });

  // ═════════ Session Type Selector ═════════
  typeOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      typeOptions.forEach(function (opt) {
        opt.classList.remove("active");
      });
      this.classList.add("active");
      var selectedType = this.dataset.type;
      classTypeInput.value = selectedType;
      if (
        selectedType === "PRACTICAL" ||
        selectedType === "THEORY" ||
        selectedType === "OTHER"
      ) {
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

  var currentWeekIndex = "";
  var currentDayIndex = "";
  var currentSessionId = null;

  function openModal(week, day, date, weekIndex, dayIndex) {
    if (isHoliday(date)) {
      alert("This day is a holiday! Cannot add session.");
      return;
    }
    currentWeekIndex = weekIndex;
    currentDayIndex = dayIndex;
    modal.classList.add("active");
    document.body.classList.add("modal-open");
    typeOptions.forEach(function (opt) {
      opt.classList.remove("active");
    });
    extraFields.style.display = "none";
    classTypeInput.value = "";
    document.getElementById("classTitle").value = "";
    document.getElementById("classFaculty").value = "";
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
    visitLocationGroup.style.display = "none";
    visitLocationInput.value = "";
  }

  document.querySelectorAll(".edit-session-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const sessionItem = this.closest(".session-item");
      if (!sessionItem) return;
      const sessionId = sessionItem.dataset.sessionId;
      currentSessionId = sessionId;

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

      const titleElement = sessionItem.querySelector(".session-title");

      const title = titleElement ? titleElement.textContent.trim() : "";
      const locationElement = sessionItem.querySelector(".session-location");
      const location = locationElement
        ? locationElement.textContent.replace("Location:", "").trim()
        : "";

      document.getElementById("startTime").value = startTime;
      document.getElementById("endTime").value = endTime;
      document.getElementById("classTitle").value = title;
      visitLocationInput.value = location;

      const facultyElement = sessionItem.querySelector(".session-faculty");
      if (facultyElement) {
        const facultyValue = facultyElement.dataset.facultyValue;
        if (facultyValue) {
          document.getElementById("classFaculty").value = facultyValue;
        }
      }

      typeOptions.forEach(function (option) {
        option.classList.remove("active");
        if (option.dataset.type === type) {
          option.classList.add("active");
        }
      });
      classTypeInput.value = type;

      if (type === "PRACTICAL" || type === "THEORY") {
        extraFields.style.display = "block";
      } else {
        extraFields.style.display = "none";
      }

      if (type === "INSTRUCTIONAL_VISIT") {
        visitLocationGroup.style.display = "block";
      } else {
        visitLocationGroup.style.display = "none";
      }

      modal.classList.add("active");
      document.body.classList.add("modal-open");
    });
  });

  // ═════════ Delete Session ═════════
  document.querySelectorAll(".delete-session-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const sessionItem = this.closest(".session-item");
      if (!sessionItem) return;
      sessionToDelete = sessionItem.dataset.sessionId;
      deleteConfirmModal.classList.add("active");
      document.body.classList.add("modal-open");
    });
  });

  function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
  closeDeleteModal.addEventListener("click", closeDeleteConfirmModal);
  cancelDelete.addEventListener("click", closeDeleteConfirmModal);
  deleteConfirmModal.addEventListener("click", function (e) {
    if (e.target === this) {
      closeDeleteConfirmModal();
    }
  });
  confirmDelete.addEventListener("click", async function () {
    if (!sessionToDelete) {
      alert("Session ID not found");
      return;
    }
    try {
      const response = await fetch(
        `${window.location.pathname}/session/${sessionToDelete}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.success) {
        closeDeleteConfirmModal();
        location.reload();
      } else {
        alert(result.message || "Failed to delete session");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting session: " + error.message);
    }
  });

  // ═════════ Add Session ═════════
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
    typeOptions.forEach(function (opt) {
      opt.classList.remove("active");
    });
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

    var type = classTypeInput.value;
    if (!type) {
      alert("Please select a session type");
      return;
    }

    var startTime = document.getElementById("startTime").value;
    var endTime = document.getElementById("endTime").value;

    if (!startTime || !endTime) {
      alert("Please select start and end time");
      return;
    }

    var title = "";
    var faculty = "";

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

    var data = {
      weekIndex: currentWeekIndex,
      dayIndex: currentDayIndex,
      startTime: startTime,
      endTime: endTime,
      type: type,
      title: title,
      faculty: faculty,
      location: visitLocationInput.value,
    };

    var url = window.location.href;
    var method = "POST";
    if (currentSessionId) {
      url = `${window.location.pathname}/session/${currentSessionId}`;
      method = "PUT";
    }

    try {
      var response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      var result = await response.json();

      if (result.success) {
        currentSessionId = null;
        closeModal();
        location.reload();
      } else {
        alert(result.message || "Failed to add session");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding session: " + error.message);
    }
  });

  // ═════════ Documentation Support Modal ═════════
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

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch");
        }

        docSupportInput1.value = data.docSupport1 || "";
        docSupportInput2.value = data.docSupport2 || "";

        saveDocSupportBtn.disabled = false;
        saveDocSupportBtn.textContent = "Save";

        docSupportModal.classList.add("active");
        document.body.classList.add("modal-open");
      } catch (err) {
        console.error(err);
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

      if (!data.success) {
        throw new Error(data.message || "Failed to save");
      }

      // Update the displayed names on the page
      const namesSpan = document.getElementById(`docSupportNames-${weekIndex}`);
      if (namesSpan) {
        const parts = [];
        if (docSupport1) parts.push(docSupport1);
        if (docSupport2) parts.push(docSupport2);
        namesSpan.textContent = parts.length > 0 ? parts.join(", ") : "Not set";
      }

      closeDocSupport();
    } catch (err) {
      console.error(err);
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
    body.innerHTML = `
                <div class="loading-text">
                    Loading PDF preview...
                </div>
            `;
    try {
      const response = await fetch(
        `/course/${window.courseId}/schedule/preview`,
      );
      if (!response.ok) {
        throw new Error("PDF fetch failed");
      }
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      body.innerHTML = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        const scale = 10;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        canvas.style.display = "block";
        canvas.style.maxWidth = "100%";
        canvas.style.height = "auto";
        canvas.style.margin = "0 auto 20px";

        body.appendChild(canvas);

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      }
    } catch (error) {
      console.error("PDF preview error:", error);
      body.innerHTML = `
                    <div class="loading-text" style="color:#b42318;">
                        Failed to load PDF preview.
                    </div>
                `;
    }
  }
});
