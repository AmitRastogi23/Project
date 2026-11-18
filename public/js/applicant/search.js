// ==========================================
// APPLICANT SEARCH — MAIN FILE
// ==========================================

const form = document.getElementById("applicantSearchForm");
const result = document.getElementById("applicantResult");

// Global store for currently searched applicant (used by Edit/Delete modals)
let currentApplicant = null;

// ==========================================
// SEARCH FORM SUBMIT
// ==========================================
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const personnelNumber = document
    .getElementById("personnelNumber")
    .value.trim();

  const name = document.getElementById("name").value.trim();

  result.style.display = "block";
  result.innerHTML = `
    <div class="loading-message">
      Searching applicant records...
    </div>
  `;

  try {
    const response = await fetch(
      `/applicant/search/${encodeURIComponent(personnelNumber)}/${encodeURIComponent(name)}`,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Applicant not found");
    }

    const applicant = data.applicant;
    const enrollments = data.enrollments;

    // Store for edit/delete modals
    currentApplicant = applicant;

    // ---- Build training history rows ----
    let historyRows = "";

    if (enrollments.length === 0) {
      historyRows = `
        <tr>
          <td colspan="7">
            No course enrollment records found.
          </td>
        </tr>
      `;
    } else {
      historyRows = enrollments
        .map((enrollment) => {
          const course = enrollment.courseId;

          const reportingDate = enrollment.reportingDate
            ? new Date(enrollment.reportingDate).toLocaleDateString("en-IN")
            : "-";

          const moDate = enrollment.MODate
            ? new Date(enrollment.MODate).toLocaleDateString("en-IN")
            : "-";

          return `
            <tr>
              <td>${course.courseNumber}</td>
              <td>${course.courseName}</td>
              <td>
                ${new Date(course.startDate).toLocaleDateString("en-IN")}
                -
                ${new Date(course.endDate).toLocaleDateString("en-IN")}
              </td>
              <td>${reportingDate}</td>
              <td>${enrollment.MONumber}</td>
              <td>${moDate}</td>
              <td>
                <div class="action-buttons">
                  <a href="/applicant/${course._id}/detention/${applicant._id}" class="btn btn-detention">📄 Detention</a>
                  <a href="/applicant/${course._id}/completion/${applicant._id}" class="btn btn-completion">🎓 Completion</a>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    // ---- Render full result ----
    result.innerHTML = `
      <div class="result-header">
        <h2>Applicant Record</h2>
        <div class="record-actions">
          <button class="record-btn edit" id="editApplicantBtn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>

          <button class="record-btn delete" id="deleteApplicantBtn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>

      <div class="applicant-info">
        <div class="info-item">
          <span class="info-label">Personnel Number</span>
          <span class="info-value">${applicant.personnelNumber}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Name</span>
          <span class="info-value">${applicant.name}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Department</span>
          <span class="info-value">${applicant.department}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Rank</span>
          <span class="info-value">${applicant.rank}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Unit Address</span>
          <span class="info-value">${applicant.unitAddress}</span>
        </div>

        <div class="info-item">
          <span class="info-label">Contact</span>
          <span class="info-value">${applicant.contact || "-"}</span>
        </div>
      </div>

      <div class="history-header">
        <h3>Training History</h3>
      </div>

      <div class="table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>Course No.</th>
              <th>Course Name</th>
              <th>Course Dates</th>
              <th>Reporting Date</th>
              <th>MO Number</th>
              <th>MO Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${historyRows}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    currentApplicant = null;
    result.innerHTML = `
      <div class="error-message">
        ${error.message}
      </div>
    `;
  }
});

// ==========================================
// EDIT / DELETE APPLICANT — MODAL LOGIC
// ==========================================

const editApplicantModal = document.getElementById("editApplicantModal");
const deleteApplicantModal = document.getElementById("deleteApplicantModal");
const editApplicantForm = document.getElementById("editApplicantForm");

// ---- OPEN MODALS (event delegation) ----
document.addEventListener("click", (event) => {
  // Open Edit modal
  if (event.target.closest("#editApplicantBtn")) {
    if (!currentApplicant) return;

    document.getElementById("editDepartment").value =
      currentApplicant.department || "";
    document.getElementById("editPersonnelNumber").value =
      currentApplicant.personnelNumber || "";
    document.getElementById("editRank").value = currentApplicant.rank || "";
    document.getElementById("editName").value = currentApplicant.name || "";
    document.getElementById("editUnitAddress").value =
      currentApplicant.unitAddress || "";
    document.getElementById("editContact").value =
      currentApplicant.contact || "";

    editApplicantModal.classList.add("active");
  }

  // Open Delete modal
  if (event.target.closest("#deleteApplicantBtn")) {
    if (!currentApplicant) return;

    document.getElementById("deleteApplicantName").textContent =
      currentApplicant.name;

    deleteApplicantModal.classList.add("active");
  }
});

// ---- CLOSE: Edit Modal ----
document
  .getElementById("closeEditApplicant")
  .addEventListener("click", () =>
    editApplicantModal.classList.remove("active"),
  );

document
  .getElementById("cancelEditApplicant")
  .addEventListener("click", () =>
    editApplicantModal.classList.remove("active"),
  );

editApplicantModal.addEventListener("click", (e) => {
  if (e.target === editApplicantModal)
    editApplicantModal.classList.remove("active");
});

// ---- CLOSE: Delete Modal ----
document
  .getElementById("cancelDeleteApplicant")
  .addEventListener("click", () =>
    deleteApplicantModal.classList.remove("active"),
  );

deleteApplicantModal.addEventListener("click", (e) => {
  if (e.target === deleteApplicantModal)
    deleteApplicantModal.classList.remove("active");
});

// ---- ESC key closes any open modal ----
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    editApplicantModal.classList.remove("active");
    deleteApplicantModal.classList.remove("active");
  }
});

// ==========================================
// SUBMIT EDIT FORM (PATCH)
// ==========================================
editApplicantForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentApplicant) return;

  const saveBtn = document.getElementById("saveEditApplicant");
  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  const payload = {
    department: document.getElementById("editDepartment").value.trim(),
    personnelNumber: document
      .getElementById("editPersonnelNumber")
      .value.trim(),
    rank: document.getElementById("editRank").value.trim(),
    name: document.getElementById("editName").value.trim(),
    unitAddress: document.getElementById("editUnitAddress").value.trim(),
    contact: document.getElementById("editContact").value.trim(),
  };

  try {
    const res = await fetch(`/applicant/edit/${currentApplicant._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Update failed");

    // Update local state
    currentApplicant = { ...currentApplicant, ...payload };

    // Refresh visible values in the DOM
    const infoValues = document.querySelectorAll(".applicant-info .info-value");
    if (infoValues.length >= 6) {
      infoValues[0].textContent = currentApplicant.personnelNumber;
      infoValues[1].textContent = currentApplicant.name;
      infoValues[2].textContent = currentApplicant.department;
      infoValues[3].textContent = currentApplicant.rank;
      infoValues[4].textContent = currentApplicant.unitAddress;
      infoValues[5].textContent = currentApplicant.contact || "-";
    }

    editApplicantModal.classList.remove("active");
  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to update applicant.");
  } finally {
    saveBtn.textContent = "Save Changes";
    saveBtn.disabled = false;
  }
});

// ==========================================
// CONFIRM DELETE (DELETE)
// ==========================================
document
  .getElementById("confirmDeleteApplicant")
  .addEventListener("click", async () => {
    if (!currentApplicant) return;

    const confirmBtn = document.getElementById("confirmDeleteApplicant");
    const cancelBtn = document.getElementById("cancelDeleteApplicant");

    confirmBtn.textContent = "Deleting...";
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;

    try {
      const res = await fetch(`/applicant/${currentApplicant._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Delete failed");

      // Clear UI
      deleteApplicantModal.classList.remove("active");
      currentApplicant = null;

      result.style.display = "none";
      result.innerHTML = "";

      form.reset();

      alert("Applicant record deleted successfully.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete applicant.");
    } finally {
      confirmBtn.textContent = "Delete";
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
