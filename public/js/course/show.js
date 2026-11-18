pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";

function renderAllPages(pdf, bodyId) {
  const body = document.getElementById(bodyId);
  body.innerHTML = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    pdf.getPage(i).then((page) => {
      const canvas = document.createElement("canvas");
      const viewport = page.getViewport({ scale: 1.2 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      page.render({ canvasContext: ctx, viewport: viewport });
    });
  }
}

// ==========================================
// EDIT MODAL
// ==========================================
function openEditModal() {
  document.getElementById("editModal").classList.add("active");
  const courseNameSelect = document.getElementById("editCourseName");
  const otherDiv = document.getElementById("editOtherCourseNameDiv");
  const otherInput = document.getElementById("editOtherCourseName");
  if (courseNameSelect.value === "Others") {
    otherDiv.style.display = "block";
    otherInput.required = true;
  } else {
    otherDiv.style.display = "none";
    otherInput.required = false;
  }
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
}

document
  .getElementById("editCourseName")
  .addEventListener("change", function () {
    const otherDiv = document.getElementById("editOtherCourseNameDiv");
    const otherInput = document.getElementById("editOtherCourseName");
    if (this.value === "Others") {
      otherDiv.style.display = "block";
      otherInput.required = true;
    } else {
      otherDiv.style.display = "none";
      otherInput.required = false;
      otherInput.value = "";
    }
  });

document.getElementById("editYear").addEventListener("input", function () {
  const year = this.value;
  if (year && year.length === 4) {
    const startDateInput = document.getElementById("editStartDate");
    const endDateInput = document.getElementById("editEndDate");
    startDateInput.min = `${year}-01-01`;
    startDateInput.max = `${year}-12-31`;
    if (startDateInput.value) {
      const selectedYear = new Date(startDateInput.value).getFullYear();
      if (selectedYear != year) {
        startDateInput.value = "";
        endDateInput.value = "";
      }
    }
  }
});

document
  .getElementById("editStartDate")
  .addEventListener("change", function () {
    const endDateInput = document.getElementById("editEndDate");
    endDateInput.min = this.value;
    if (endDateInput.value && endDateInput.value <= this.value) {
      endDateInput.value = "";
    }
  });

function submitEditForm() {
  const courseId = document.getElementById("editCourseId").value;
  const year = document.getElementById("editYear").value;
  const courseNumber = document.getElementById("editCourseNumber").value;
  let courseName = document.getElementById("editCourseName").value;
  const otherCourseName = document.getElementById("editOtherCourseName").value;
  const startDate = document.getElementById("editStartDate").value;
  const endDate = document.getElementById("editEndDate").value;
  const oldYearId = window.courseData.yearId; // Purana Year ID

  if (courseName === "Others") {
    if (!otherCourseName.trim())
      return alert("Please enter custom course name.");
    courseName = otherCourseName.trim();
  }

  if (!year || !courseNumber || !courseName || !startDate || !endDate) {
    return alert("All fields are required.");
  }

  const btn = document.getElementById("saveEditBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  fetch(`/course/${courseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year,
      courseNumber,
      courseName,
      startDate,
      endDate,
    }),
  })
    .then((res) => {
      if (!res.ok)
        return res.text().then((t) => {
          throw new Error(t);
        });
      return res.text();
    })
    .then((msg) => {
      alert(msg);
      // Edit ke baad hamesha purane year ke page par redirect karo
      window.location.href = `/year/${oldYearId}`;
    })
    .catch((err) => alert("Error: " + err.message))
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Save Changes";
    });
}

// ==========================================
// DELETE MODAL
// ==========================================
function openDeleteModal() {
  document.getElementById("deleteModal").classList.add("active");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("active");
}

function submitDelete() {
  const courseId = document.getElementById("editCourseId").value;
  const oldYearId = window.courseData.yearId; // Purana Year ID
  const btn = document.getElementById("confirmDeleteBtn");
  btn.disabled = true;
  btn.textContent = "Deleting...";

  fetch(`/course/${courseId}`, { method: "DELETE" })
    .then((res) => {
      if (!res.ok)
        return res.text().then((t) => {
          throw new Error(t);
        });
      return res.text();
    })
    .then((msg) => {
      alert(msg);
      // Delete hone ke baad bhi purane year ke page par redirect
      window.location.href = `/year/${oldYearId}`;
    })
    .catch((err) => {
      alert("Error: " + err.message);
      btn.disabled = false;
      btn.textContent = "Delete Permanently";
    });
}

// ==========================================
// DETENTION CERTIFICATE - MODAL
// ==========================================
let detentionPdfUrl = "";

function openDetentionModal(courseId) {
  const modal = document.getElementById("detentionModal");
  const body = document.getElementById("detentionModalBody");
  modal.classList.add("active");
  body.innerHTML = '<div class="loading-text">Loading PDF preview...</div>';
  detentionPdfUrl = "/applicant/" + courseId + "/detention/preview";
  document.getElementById("detentionPdfLink").href = detentionPdfUrl;

  fetch(detentionPdfUrl)
    .then((response) => {
      if (!response.ok) throw new Error("PDF fetch failed");
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => pdfjsLib.getDocument({ data: arrayBuffer }).promise)
    .then((pdf) => renderAllPages(pdf, "detentionModalBody"))
    .catch((error) => {
      body.innerHTML =
        '<div class="loading-text" style="color:#b42318;">Failed to load PDF.</div>';
      console.error(error);
    });
}

function closeDetentionModal() {
  document.getElementById("detentionModal").classList.remove("active");
  document.getElementById("detentionModalBody").innerHTML =
    '<div class="loading-text">Loading PDF preview...</div>';
  detentionPdfUrl = "";
  document.getElementById("detentionPdfLink").href = "";
}

document
  .getElementById("detentionModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeDetentionModal();
  });

// ==========================================
// COMPLETION CERTIFICATE - MODAL
// ==========================================
let completionPdfUrl = "";

function openCompletionModal(courseId) {
  const modal = document.getElementById("completionModal");
  const body = document.getElementById("completionModalBody");
  modal.classList.add("active");
  body.innerHTML = '<div class="loading-text">Loading PDF preview...</div>';
  completionPdfUrl = "/applicant/" + courseId + "/completion/preview";
  document.getElementById("completionPdfLink").href = completionPdfUrl;

  fetch(completionPdfUrl)
    .then((response) => {
      if (!response.ok) throw new Error("PDF fetch failed");
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => pdfjsLib.getDocument({ data: arrayBuffer }).promise)
    .then((pdf) => renderAllPages(pdf, "completionModalBody"))
    .catch((error) => {
      body.innerHTML =
        '<div class="loading-text" style="color:#b42318;">Failed to load PDF.</div>';
      console.error(error);
    });
}

function closeCompletionModal() {
  document.getElementById("completionModal").classList.remove("active");
  document.getElementById("completionModalBody").innerHTML =
    '<div class="loading-text">Loading PDF preview...</div>';
  completionPdfUrl = "";
  document.getElementById("completionPdfLink").href = "";
}

document
  .getElementById("completionModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeCompletionModal();
  });

// ==========================================
// CLEARANCE CERTIFICATE - MODAL
// ==========================================
let clearancePdfUrl = "";

function openClearanceModal(courseId) {
  const modal = document.getElementById("clearanceModal");
  const body = document.getElementById("clearanceModalBody");
  modal.classList.add("active");
  body.innerHTML = '<div class="loading-text">Loading PDF preview...</div>';
  clearancePdfUrl = "/applicant/" + courseId + "/clearance/preview";
  document.getElementById("clearancePdfLink").href = clearancePdfUrl;

  fetch(clearancePdfUrl)
    .then((response) => {
      if (!response.ok) throw new Error("PDF fetch failed");
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => pdfjsLib.getDocument({ data: arrayBuffer }).promise)
    .then((pdf) => renderAllPages(pdf, "clearanceModalBody"))
    .catch((error) => {
      body.innerHTML =
        '<div class="loading-text" style="color:#b42318;">Failed to load PDF.</div>';
      console.error(error);
    });
}

function closeClearanceModal() {
  document.getElementById("clearanceModal").classList.remove("active");
  document.getElementById("clearanceModalBody").innerHTML =
    '<div class="loading-text">Loading PDF preview...</div>';
  clearancePdfUrl = "";
  document.getElementById("clearancePdfLink").href = "";
}

document
  .getElementById("clearanceModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeClearanceModal();
  });
