const departmentSelect = document.getElementById("department");
const viewButton = document.getElementById("viewApplicants");
const applicantContainer = document.getElementById("applicantContainer");
let currentApplicants = [];

async function loadDepartments() {
  try {
    const res = await fetch(`/applicant/${window.courseId}/departments`);
    if (!res.ok) throw new Error("Failed to load departments");

    const data = await res.json();
    const departments = data.departments || [];

    departmentSelect.innerHTML = "";

    if (departments.length === 0) {
      // Dropdown mein "No applicants" dikhao
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.textContent = "No applicants enrolled yet";
      departmentSelect.appendChild(opt);

      // View button disable kar do
      viewButton.disabled = true;
      viewButton.textContent = "No Applicants";

      // Container mein empty state aur Add button dikhao
      applicantContainer.innerHTML = `
        <div class="empty">
          <h3>No Applicants Found</h3>
          <p>This course currently has no enrollments. Click the button below to add the first applicant.</p>
        </div>
        <div class="button-container">
          <a href="/applicant/new/${window.courseId}" class="action-btn">
            Add New Applicant
          </a>
        </div>
      `;

      return;
    }

    // Placeholder option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = "Select a department";
    departmentSelect.appendChild(placeholder);

    // Each department
    departments.forEach((dept) => {
      const opt = document.createElement("option");
      opt.value = dept;
      opt.textContent = dept;
      departmentSelect.appendChild(opt);
    });

    // Complete Nominal Roll option at the end
    const completeOpt = document.createElement("option");
    completeOpt.value = "Complete";
    completeOpt.textContent = "Complete Nominal Roll";
    departmentSelect.appendChild(completeOpt);

    // Agar departments hain, toh View button enable karo
    viewButton.disabled = false;
    viewButton.textContent = "View Applicants";
  } catch (err) {
    console.error(err);
    departmentSelect.innerHTML =
      '<option value="" disabled selected>Failed to load departments</option>';
    viewButton.disabled = true;
  }
}

loadDepartments();

viewButton.addEventListener("click", async () => {
  const department = departmentSelect.value;

  // Agar department select nahi kiya, toh kuch mat karo
  if (!department) return;

  viewButton.textContent = "Loading...";
  viewButton.disabled = true;

  try {
    const response = await fetch(
      `/applicant/${window.courseId}/${encodeURIComponent(department)}`,
    );

    const applicants = await response.json();

    currentApplicants = applicants;

    if (applicants.length === 0) {
      applicantContainer.innerHTML = `
              <div class="empty">
                <h3>No Applicants Found</h3>
                <p>No applicant records are available for the selected department.</p>
              </div>
              <div class="button-container">
                <a href="/applicant/new/${window.courseId}" class="action-btn">
                  Add Applicant
                </a>
              </div>
            `;
      return;
    }

    let table = `
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Personnel No.</th>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Unit Address</th>
                    <th>Reporting Date</th>
                    <th>Noon Time</th>
                    <th>Contact</th>
                    <th>MO Number</th>
                    <th>MO Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
          `;

    let currentDepartment = "";
    let serialNumber = 1;

    applicants.forEach((applicant) => {
      if (
        department === "Complete" &&
        applicant.applicantId.department !== currentDepartment
      ) {
        currentDepartment = applicant.applicantId.department;

        table += `
                <tr class="department-row">
                  <td colspan="11">
                    ${currentDepartment.toUpperCase()}
                  </td>
                </tr>
              `;
      }

      table += `
              <tr>
                <td>${serialNumber++}</td>
                <td>${applicant.applicantId.personnelNumber || "-"}</td>
                <td>${applicant.applicantId.rank || "-"}</td>
                <td>${applicant.applicantId.name || "-"}</td>
                <td>${applicant.applicantId.unitAddress || "-"}</td>
                <td>${
                  applicant.reportingDate
                    ? new Date(applicant.reportingDate).toLocaleDateString(
                        "en-IN",
                      )
                    : "-"
                }</td>
                <td>${applicant.noonTime || "-"}</td>
                <td>${applicant.applicantId.contact || "-"}</td>
                <td>${applicant.MONumber || "-"}</td>
                <td>${
                  applicant.MODate
                    ? new Date(applicant.MODate).toLocaleDateString("en-IN")
                    : "-"
                }</td>
                <td class="actions-cell">
                  <button class="edit-btn" title="Edit Enrollment" data-enrollment-id="${applicant._id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="delete-btn" title="Delete Enrollment" data-enrollment-id="${applicant._id}" data-applicant-name="${applicant.applicantId.name || "this applicant"}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            `;
    });

    table += `
                </tbody>
              </table>
            </div>
            <div class="button-container">
              <button id="downloadNominalRoll" class="action-btn">Export to PDF</button>
              <button id="exportExcel" class="action-btn">Export to Excel</button>
              <a href="/applicant/new/${window.courseId}" class="action-btn">Add Applicant</a>
            </div>
          `;

    applicantContainer.innerHTML = table;
  } catch (error) {
    console.error(error);
    applicantContainer.innerHTML = `
            <div class="empty">
              <h3>Unable to Load Applicants</h3>
              <p>Please try again.</p>
            </div>
          `;
  } finally {
    viewButton.textContent = "View Applicants";
    viewButton.disabled = false;
  }
});

// ==========================================
// DOWNLOAD NOMINAL ROLL PDF
// ==========================================
document.addEventListener("click", async (event) => {
  if (event.target.id !== "downloadNominalRoll") {
    return;
  }

  const button = event.target;
  button.textContent = "Generating...";
  button.disabled = true;

  try {
    const response = await fetch(`/applicant/${window.courseId}/nominalRoll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicants: currentApplicants }),
    });

    if (!response.ok) throw new Error("Failed to generate nominal roll");

    const pdfBlob = await response.blob();
    const pdfUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "Nominal Roll.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(pdfUrl);
  } catch (error) {
    console.error(error);
    alert("Failed to generate Nominal Roll.");
  } finally {
    button.textContent = "Export to PDF";
    button.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  if (event.target.id !== "exportExcel") {
    return;
  }

  const button = event.target;
  button.textContent = "Generating...";
  button.disabled = true;

  try {
    const response = await fetch(
      `/applicant/${window.courseId}/nominalRoll/excel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicants: currentApplicants }),
      },
    );

    if (!response.ok) throw new Error("Failed to generate Excel file");

    const excelBlob = await response.blob();
    const excelUrl = window.URL.createObjectURL(excelBlob);
    const link = document.createElement("a");
    link.href = excelUrl;
    link.download = "Nominal Roll.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(excelUrl);
  } catch (error) {
    console.error(error);
    alert("Failed to export Nominal Roll to Excel.");
  } finally {
    button.textContent = "Export to Excel";
    button.disabled = false;
  }
});

// ==========================================
// DELETE ENROLLMENT MODAL LOGIC
// ==========================================
const deleteModal = document.getElementById("deleteModal");
const modalApplicantName = document.getElementById("modalApplicantName");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");

let enrollmentToDelete = null;

document.addEventListener("click", (event) => {
  const deleteBtn = event.target.closest(".delete-btn");
  if (!deleteBtn) return;

  enrollmentToDelete = deleteBtn.dataset.enrollmentId;
  const name = deleteBtn.dataset.applicantName;

  modalApplicantName.textContent = name;
  deleteModal.classList.add("active");
});

cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.classList.remove("active");
  enrollmentToDelete = null;
});

deleteModal.addEventListener("click", (event) => {
  if (event.target === deleteModal) {
    deleteModal.classList.remove("active");
    enrollmentToDelete = null;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && deleteModal.classList.contains("active")) {
    deleteModal.classList.remove("active");
    enrollmentToDelete = null;
  }
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!enrollmentToDelete) return;

  confirmDeleteBtn.textContent = "Deleting...";
  confirmDeleteBtn.disabled = true;
  cancelDeleteBtn.disabled = true;

  try {
    const res = await fetch(
      `/applicant/${window.courseId}/enrollment/${enrollmentToDelete}`,
      { method: "DELETE" },
    );

    if (!res.ok) throw new Error("Delete failed");

    const row = document
      .querySelector(`.delete-btn[data-enrollment-id="${enrollmentToDelete}"]`)
      ?.closest("tr");
    if (row) row.remove();

    currentApplicants = currentApplicants.filter(
      (a) => a._id !== enrollmentToDelete,
    );

    deleteModal.classList.remove("active");
    enrollmentToDelete = null;

    if (currentApplicants.length === 0) {
      await loadDepartments(); // Agar last enrollment delete hua, toh dropdown refresh karo
    }
  } catch (err) {
    console.error(err);
    alert("Failed to delete enrollment. Please try again.");
  } finally {
    confirmDeleteBtn.textContent = "Delete";
    confirmDeleteBtn.disabled = false;
    cancelDeleteBtn.disabled = false;
  }
});

// ==========================================
// EDIT ENROLLMENT MODAL LOGIC
// ==========================================
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editEnrollmentForm");
const closeEditModalBtn = document.getElementById("closeEditModal");
const cancelEditBtn = document.getElementById("cancelEdit");

const editPersonnelNumber = document.getElementById("editPersonnelNumber");
const editRank = document.getElementById("editRank");
const editName = document.getElementById("editName");
const editUnitAddress = document.getElementById("editUnitAddress");
const editContact = document.getElementById("editContact");

const editReportingDate = document.getElementById("editReportingDate");
const editMONumber = document.getElementById("editMONumber");
const editMODate = document.getElementById("editMODate");
const editNoonTimeRadios = document.querySelectorAll('input[name="noonTime"]');

let editingEnrollmentId = null;

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

document.addEventListener("click", (event) => {
  const editBtn = event.target.closest(".edit-btn");
  if (!editBtn) return;

  const enrollmentId = editBtn.dataset.enrollmentId;
  const enrollment = currentApplicants.find((a) => a._id === enrollmentId);
  if (!enrollment) {
    alert("Enrollment data not found.");
    return;
  }

  editingEnrollmentId = enrollmentId;

  editPersonnelNumber.value = enrollment.applicantId?.personnelNumber || "";
  editRank.value = enrollment.applicantId?.rank || "";
  editName.value = enrollment.applicantId?.name || "";
  editUnitAddress.value = enrollment.applicantId?.unitAddress || "";
  editContact.value = enrollment.applicantId?.contact || "";

  editReportingDate.value = toDateInputValue(enrollment.reportingDate);
  editMONumber.value = enrollment.MONumber || "";
  editMODate.value = toDateInputValue(enrollment.MODate);

  editNoonTimeRadios.forEach((radio) => {
    radio.checked = radio.value === enrollment.noonTime;
  });

  editModal.classList.add("active");
});

closeEditModalBtn.addEventListener("click", closeEditModal);
cancelEditBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", (event) => {
  if (event.target === editModal) closeEditModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editModal.classList.contains("active")) {
    closeEditModal();
  }
});

function closeEditModal() {
  editModal.classList.remove("active");
  editingEnrollmentId = null;
  editForm.reset();
}

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!editingEnrollmentId) return;

  const saveBtn = document.getElementById("saveEdit");
  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  const noonTime = document.querySelector(
    'input[name="noonTime"]:checked',
  )?.value;

  const payload = {
    reportingDate: editReportingDate.value,
    noonTime: noonTime,
    MONumber: editMONumber.value.trim(),
    MODate: editMODate.value,
  };

  try {
    const res = await fetch(
      `/applicant/${window.courseId}/enrollment/${editingEnrollmentId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) throw new Error("Update failed");

    const data = await res.json();

    const idx = currentApplicants.findIndex(
      (a) => a._id === editingEnrollmentId,
    );
    if (idx !== -1 && data.enrollment) {
      currentApplicants[idx].reportingDate = data.enrollment.reportingDate;
      currentApplicants[idx].noonTime = data.enrollment.noonTime;
      currentApplicants[idx].MONumber = data.enrollment.MONumber;
      currentApplicants[idx].MODate = data.enrollment.MODate;
    }

    updateRowInTable(editingEnrollmentId, payload);
    closeEditModal();
  } catch (err) {
    console.error(err);
    alert("Failed to update enrollment. Please try again.");
  } finally {
    saveBtn.textContent = "Save Changes";
    saveBtn.disabled = false;
  }
});

function updateRowInTable(enrollmentId, payload) {
  const editBtn = document.querySelector(
    `.edit-btn[data-enrollment-id="${enrollmentId}"]`,
  );
  if (!editBtn) return;

  const row = editBtn.closest("tr");
  if (!row) return;

  const cells = row.querySelectorAll("td");

  if (payload.reportingDate) {
    cells[5].textContent = new Date(payload.reportingDate).toLocaleDateString(
      "en-IN",
    );
  }
  if (payload.noonTime) {
    cells[6].textContent = payload.noonTime;
  }
  if (payload.MONumber) {
    cells[8].textContent = payload.MONumber;
  }
  if (payload.MODate) {
    cells[9].textContent = new Date(payload.MODate).toLocaleDateString("en-IN");
  }
}
