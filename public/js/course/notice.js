document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const requestForm = document.getElementById("requestForm");

  const examTypeSelect = document.getElementById("examType");
  const dateInput = document.getElementById("date");
  const examDateHint = document.getElementById("examDateHint");

  const examinerSelect = document.getElementById("examinerSelect");
  const examinerHint = document.getElementById("examinerHint");

  const courseId = openModalBtn.dataset.courseId;

  let examDatesCache = { midTermDate: null, finalTermDate: null };

  // ============ FETCH EXAM DATES ============
  async function fetchExamDates() {
    try {
      examDateHint.textContent = "Fetching exam dates...";
      examDateHint.style.color = "#666";

      const res = await fetch(`/course/${courseId}/exam-dates`);
      if (!res.ok) throw new Error("Failed to fetch exam dates");

      const data = await res.json();
      examDatesCache.midTermDate = data.midTermDate;
      examDatesCache.finalTermDate = data.finalTermDate;

      const mid = data.midTermDate ? "✅" : "❌";
      const fin = data.finalTermDate ? "✅" : "❌";
      examDateHint.textContent = `MID-TERM: ${mid}  |  FINAL-TERM: ${fin}`;
      examDateHint.style.color = "#666";
    } catch (err) {
      console.error(err);
      examDateHint.textContent = "Could not load exam dates.";
      examDateHint.style.color = "red";
    }
  }

  // ============ FETCH EXAMINERS FOR DROPDOWN ============
  async function loadExaminers() {
    if (!examinerSelect) return;

    examinerSelect.innerHTML = `<option value="" disabled selected>Loading examiners...</option>`;
    if (examinerHint) {
      examinerHint.textContent = "";
    }

    try {
      const res = await fetch("/address/examiners");
      const data = await res.json();

      if (!data.success || !data.examiners || data.examiners.length === 0) {
        examinerSelect.innerHTML = `<option value="" disabled selected>No examiners found</option>`;
        if (examinerHint) {
          examinerHint.textContent =
            "Add examiner records in Address Store first.";
          examinerHint.style.color = "orange";
        }
        return;
      }

      examinerSelect.innerHTML = `<option value="" disabled selected>Select an examiner</option>`;

      data.examiners.forEach((ex) => {
        const opt = document.createElement("option");
        opt.value = ex.address;
        opt.textContent = ex.name;
        opt.dataset.id = ex._id;
        opt.dataset.address = ex.address;
        examinerSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load examiners:", err);
      examinerSelect.innerHTML = `<option value="" disabled selected>Failed to load</option>`;
      if (examinerHint) {
        examinerHint.textContent = "Could not fetch examiners.";
        examinerHint.style.color = "red";
      }
    }
  }

  // ============ OPEN MODAL ============
  openModalBtn.addEventListener("click", () => {
    modalOverlay.classList.add("active");
    fetchExamDates();
    loadExaminers();
  });

  // ============ CLOSE MODAL ============
  const closeModal = () => {
    modalOverlay.classList.remove("active");
    requestForm.reset();
    document.getElementById("startTime").value = "10:00";
    document.getElementById("endTime").value = "13:00";
    dateInput.value = "";
    examDateHint.textContent = "";

    if (examinerSelect) {
      examinerSelect.innerHTML = `<option value="" disabled selected>Loading examiners...</option>`;
    }
    if (examinerHint) {
      examinerHint.textContent = "";
    }
  };

  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });

  // ============ EXAM TYPE CHANGE → AUTO-FILL DATE ============
  examTypeSelect.addEventListener("change", () => {
    const selected = examTypeSelect.value;
    let fetchedDate = null;

    if (selected === "MID-TERM") fetchedDate = examDatesCache.midTermDate;
    else if (selected === "FINAL-TERM")
      fetchedDate = examDatesCache.finalTermDate;

    if (fetchedDate) {
      dateInput.value = fetchedDate;
      examDateHint.textContent = `Exam date auto-filled: ${fetchedDate}`;
      examDateHint.style.color = "green";
    } else {
      dateInput.value = "";
      examDateHint.textContent = `No ${selected} date found in schedule — please pick manually.`;
      examDateHint.style.color = "orange";
    }
  });

  // ============ EXAMINER DROPDOWN CHANGE → SHOW ADDRESS HINT ============
  if (examinerSelect) {
    examinerSelect.addEventListener("change", function () {
      const selected = this.options[this.selectedIndex];
      if (examinerHint) {
        examinerHint.textContent = `📍 ${selected.dataset.address || ""}`;
        examinerHint.style.color = "#666";
      }
    });
  }

  // ============ SUBMIT REQUEST ============
  requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🔵 Submit handler triggered");

    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (startTime >= endTime) {
      alert("End Time must be greater than Start Time.");
      return;
    }

    const address = examinerSelect ? examinerSelect.value.trim() : "";
    if (!address) {
      alert("Please select an examiner.");
      return;
    }

    const payload = {
      address,
      examType: examTypeSelect.value,
      marks: document.getElementById("marks").value,
      date: dateInput.value,
      startTime,
      endTime,
    };

    console.log("🔵 Payload:", payload);

    try {
      console.log("🔵 Calling external-examiner...");
      const res1 = await fetch(`/course/${courseId}/external-examiner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("🟢 external-examiner status:", res1.status);

      if (!res1.ok) {
        const errText = await res1.text();
        console.error("🔴 external-examiner error body:", errText);
        throw new Error("External Examiner PDF failed");
      }

      const blob1 = await res1.blob();
      console.log("🟢 external blob size:", blob1.size);
      triggerDownload(blob1, "ExternalExaminer.pdf");

      console.log("🔵 Calling internal-invigilator...");
      const res2 = await fetch(`/course/${courseId}/internal-invigilator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("🟢 internal-invigilator status:", res2.status);

      if (!res2.ok) {
        const errText = await res2.text();
        console.error("🔴 internal-invigilator error body:", errText);
        throw new Error("Internal Invigilator PDF failed");
      }

      const blob2 = await res2.blob();
      console.log("🟢 internal blob size:", blob2.size);
      triggerDownload(blob2, "InternalInvigilator.pdf");

      closeModal();
    } catch (err) {
      console.error("🔴 Caught error:", err);
      alert("Failed: " + err.message);
    }
  });

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ============ INSTRUCTIONAL VISITS MODAL ============
  const openVisitsModalBtn = document.getElementById("openVisitsModalBtn");
  const visitsModalOverlay = document.getElementById("visitsModalOverlay");
  const closeVisitsModalBtn = document.getElementById("closeVisitsModalBtn");
  const cancelVisitsBtn = document.getElementById("cancelVisitsBtn");
  const visitsLoading = document.getElementById("visitsLoading");
  const visitsEmpty = document.getElementById("visitsEmpty");
  const visitsList = document.getElementById("visitsList");

  const visitsCourseId = openVisitsModalBtn.dataset.courseId;

  async function fetchInstructionalVisits() {
    visitsLoading.style.display = "block";
    visitsEmpty.style.display = "none";
    visitsList.innerHTML = "";

    try {
      const res = await fetch(`/course/${visitsCourseId}/instructional-visits`);
      if (!res.ok) throw new Error("Failed to fetch visits");

      const data = await res.json();
      const visits = data.visits || [];

      visitsLoading.style.display = "none";

      if (visits.length === 0) {
        visitsEmpty.style.display = "block";
        return;
      }

      visits.forEach((v) => {
        const dateStr = new Date(v.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });

        const card = document.createElement("div");
        card.className = "visit-card";
        card.innerHTML = `
    <div class="visit-title">${escapeHtml(v.title)}</div>
    <div class="visit-row">
      <span class="label">Date:</span>
      <span>${dateStr} (${escapeHtml(v.day || "")})</span>
    </div>
    <div class="visit-row">
      <span class="label">Time:</span>
      <span>${escapeHtml(v.startTime)} - ${escapeHtml(v.endTime)}</span>
    </div>
    <div class="visit-row">
      <span class="label">Location:</span>
      <span>${escapeHtml(v.location)}</span>
    </div>
    <div class="visit-actions">
      <button
        type="button"
        class="btn-download-ion"
        data-session-id="${escapeHtml(v._id)}"
      >
        Download ION
      </button>
    </div>
  `;
        visitsList.appendChild(card);
      });

      visitsList.querySelectorAll(".btn-download-ion").forEach((btn) => {
        btn.addEventListener("click", function () {
          const sessionId = this.dataset.sessionId;
          const url = `/course/${visitsCourseId}/instructional-visit/${sessionId}/ion`;

          const a = document.createElement("a");
          a.href = url;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      });
    } catch (err) {
      console.error(err);
      visitsLoading.style.display = "none";
      visitsEmpty.textContent = "Failed to load visits.";
      visitsEmpty.style.color = "red";
      visitsEmpty.style.display = "block";
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  openVisitsModalBtn.addEventListener("click", () => {
    visitsModalOverlay.classList.add("active");
    fetchInstructionalVisits();
  });

  const closeVisitsModal = () => {
    visitsModalOverlay.classList.remove("active");
    visitsList.innerHTML = "";
    visitsLoading.style.display = "block";
    visitsEmpty.style.display = "none";
  };

  closeVisitsModalBtn.addEventListener("click", closeVisitsModal);
  cancelVisitsBtn.addEventListener("click", closeVisitsModal);

  visitsModalOverlay.addEventListener("click", (e) => {
    if (e.target === visitsModalOverlay) closeVisitsModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && visitsModalOverlay.classList.contains("active")) {
      closeVisitsModal();
    }
  });

  // ============ THEORY LECTURES DOWNLOAD ============
  const downloadTheoryBtn = document.getElementById("downloadTheoryBtn");

  downloadTheoryBtn.addEventListener("click", async function () {
    const courseId = this.dataset.courseId;
    const originalText = this.textContent;

    this.disabled = true;
    this.textContent = "Generating...";

    try {
      const res = await fetch(`/course/${courseId}/theory-lectures/pdf`, {
        method: "GET",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : "TheoryLectures.pdf";

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Theory lectures download error:", err);
      alert("Failed to download PDF: " + err.message);
    } finally {
      this.disabled = false;
      this.textContent = originalText;
    }
  });

  // ============ GUEST FACULTY LECTURES ============
  const openGuestModalBtn = document.getElementById("openGuestModalBtn");
  const guestModalOverlay = document.getElementById("guestModalOverlay");
  const closeGuestModalBtn = document.getElementById("closeGuestModalBtn");
  const cancelGuestBtn = document.getElementById("cancelGuestBtn");
  const guestLoading = document.getElementById("guestLoading");
  const guestEmpty = document.getElementById("guestEmpty");
  const guestList = document.getElementById("guestList");

  const guestCourseId = openGuestModalBtn.dataset.courseId;
  let currentGuestGroup = null;

  async function fetchGuestLectures() {
    guestLoading.style.display = "block";
    guestEmpty.style.display = "none";
    guestList.innerHTML = "";

    try {
      const res = await fetch(
        `/course/${guestCourseId}/guest-faculty-lectures`,
      );
      if (!res.ok) throw new Error("Failed to fetch guest lectures");

      const data = await res.json();
      const lectures = data.lectures || [];

      guestLoading.style.display = "none";

      if (lectures.length === 0) {
        guestEmpty.style.display = "block";
        return;
      }

      lectures.forEach((l) => {
        const dateStr = new Date(l.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });

        const card = document.createElement("div");
        card.className = "visit-card";
        card.innerHTML = `
        <div class="visit-title">${escapeHtml(l.faculty)}</div>
        <div class="visit-row">
          <span class="label">Title:</span>
          <span>${escapeHtml(l.title)}</span>
        </div>
        <div class="visit-row">
          <span class="label">Type:</span>
          <span>${escapeHtml(l.type)}</span>
        </div>
        <div class="visit-row">
          <span class="label">Date:</span>
          <span>${dateStr} (${escapeHtml(l.day || "")})</span>
        </div>
        <div class="visit-row">
          <span class="label">Time:</span>
          <span>${escapeHtml(l.startTime)} - ${escapeHtml(l.endTime)}</span>
        </div>
        <div class="visit-row">
          <span class="label">Location:</span>
          <span>${escapeHtml(l.location)}</span>
        </div>
        <div class="visit-actions">
          <button
            type="button"
            class="btn-download-ion"
            data-session-id="${escapeHtml(l._id)}"
          >
            Download Invite
          </button>
        </div>
      `;
        guestList.appendChild(card);
      });

      guestList.querySelectorAll(".btn-download-ion").forEach((btn) => {
        btn.addEventListener("click", function () {
          const sessionId = this.dataset.sessionId;
          currentGuestGroup = lectures.find((l) => l._id === sessionId) || null;
          openGuestAddressModal(sessionId);
        });
      });
    } catch (err) {
      console.error(err);
      guestLoading.style.display = "none";
      guestEmpty.textContent = "Failed to load lectures.";
      guestEmpty.style.color = "red";
      guestEmpty.style.display = "block";
    }
  }

  openGuestModalBtn.addEventListener("click", () => {
    guestModalOverlay.classList.add("active");
    fetchGuestLectures();
  });

  const closeGuestModal = () => {
    guestModalOverlay.classList.remove("active");
    guestList.innerHTML = "";
    guestLoading.style.display = "block";
    guestEmpty.style.display = "none";
  };

  closeGuestModalBtn.addEventListener("click", closeGuestModal);
  cancelGuestBtn.addEventListener("click", closeGuestModal);

  guestModalOverlay.addEventListener("click", (e) => {
    if (e.target === guestModalOverlay) closeGuestModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && guestModalOverlay.classList.contains("active")) {
      closeGuestModal();
    }
  });

  // ============ ADDRESS MODAL STATE ============
  const guestAddressModalOverlay = document.getElementById(
    "guestAddressModalOverlay",
  );
  const closeGuestAddressBtn = document.getElementById("closeGuestAddressBtn");
  const cancelGuestAddressBtn = document.getElementById(
    "cancelGuestAddressBtn",
  );
  const confirmGuestAddressBtn = document.getElementById(
    "confirmGuestAddressBtn",
  );
  const guestInstituteSelect = document.getElementById("guestInstituteSelect");
  const guestInstituteHint = document.getElementById("guestInstituteHint");

  let pendingGuestSessionId = null;

  // ============ FETCH GUEST FACULTY INSTITUTES ============
  async function loadGuestInstitutes() {
    if (!guestInstituteSelect) return;

    guestInstituteSelect.innerHTML = `<option value="" disabled selected>Loading institutes...</option>`;
    if (guestInstituteHint) {
      guestInstituteHint.textContent = "";
    }

    try {
      const res = await fetch("/address/guest-faculty");
      const data = await res.json();

      if (!data.success || !data.institutes || data.institutes.length === 0) {
        guestInstituteSelect.innerHTML = `<option value="" disabled selected>No institutes found</option>`;
        if (guestInstituteHint) {
          guestInstituteHint.textContent =
            "Add guest faculty institutes in Address Store first.";
          guestInstituteHint.style.color = "orange";
        }
        return;
      }

      guestInstituteSelect.innerHTML = `<option value="" disabled selected>Select an institute</option>`;

      data.institutes.forEach((inst) => {
        const opt = document.createElement("option");
        opt.value = inst.address;
        opt.textContent = inst.name;
        opt.dataset.id = inst._id;
        opt.dataset.address = inst.address;
        guestInstituteSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load institutes:", err);
      guestInstituteSelect.innerHTML = `<option value="" disabled selected>Failed to load</option>`;
      if (guestInstituteHint) {
        guestInstituteHint.textContent = "Could not fetch institutes.";
        guestInstituteHint.style.color = "red";
      }
    }
  }

  // ============ INSTITUTE DROPDOWN CHANGE → SHOW ADDRESS HINT ============
  if (guestInstituteSelect) {
    guestInstituteSelect.addEventListener("change", function () {
      const selected = this.options[this.selectedIndex];
      if (guestInstituteHint) {
        guestInstituteHint.textContent = `📍 ${selected.dataset.address || ""}`;
        guestInstituteHint.style.color = "#666";
      }
    });
  }

  function openGuestAddressModal(sessionId) {
    pendingGuestSessionId = sessionId;
    guestAddressModalOverlay.classList.add("active");
    loadGuestInstitutes();
  }

  function closeGuestAddressModal() {
    guestAddressModalOverlay.classList.remove("active");
    pendingGuestSessionId = null;

    if (guestInstituteSelect) {
      guestInstituteSelect.innerHTML = `<option value="" disabled selected>Loading institutes...</option>`;
    }
    if (guestInstituteHint) {
      guestInstituteHint.textContent = "";
    }
  }

  closeGuestAddressBtn.addEventListener("click", closeGuestAddressModal);
  cancelGuestAddressBtn.addEventListener("click", closeGuestAddressModal);

  guestAddressModalOverlay.addEventListener("click", (e) => {
    if (e.target === guestAddressModalOverlay) closeGuestAddressModal();
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      guestAddressModalOverlay.classList.contains("active")
    ) {
      closeGuestAddressModal();
    }
  });

  // ============ CONFIRM ADDRESS → DOWNLOAD PDF ============
  confirmGuestAddressBtn.addEventListener("click", async function () {
    const address = guestInstituteSelect
      ? guestInstituteSelect.value.trim()
      : "";

    if (!address) {
      alert("Please select an institute.");
      return;
    }
    if (!pendingGuestSessionId) {
      alert("No lecture selected.");
      return;
    }

    const originalText = this.textContent;
    this.disabled = true;
    this.textContent = "Generating...";

    try {
      const res = await fetch(
        `/course/${guestCourseId}/guest-faculty/${pendingGuestSessionId}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            sessionIds: currentGuestGroup?.sessionIds || [
              pendingGuestSessionId,
            ],
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to generate invite");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : "GuestFacultyInvite.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      closeGuestAddressModal();
    } catch (err) {
      console.error("🔴 Invite download error:", err);
      alert("Failed: " + err.message);
    } finally {
      this.disabled = false;
      this.textContent = originalText;
    }
  });
});
