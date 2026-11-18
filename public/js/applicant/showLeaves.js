function openLeaveModal(enrollmentId) {
  document.getElementById("modalEnrollmentId").value = enrollmentId;
  document.getElementById("leaveDate").value = "";
  document.getElementById("leaveModal").classList.add("active");
}

function closeLeaveModal() {
  document.getElementById("leaveModal").classList.remove("active");
}

document.getElementById("leaveForm").addEventListener("submit", function (e) {
  const enrollmentId = document.getElementById("modalEnrollmentId").value;
  this.action = "/applicant/" + enrollmentId + "/addleave";
});

document.getElementById("leaveModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeLeaveModal();
  }
});

function exportPDF() {
  alert("Export to PDF functionality will be added later.");
}

function exportExcel() {
  alert("Export to Excel functionality will be added later.");
}
