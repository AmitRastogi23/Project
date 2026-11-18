function openSOSModal(enrollmentId, currentReason, currentDate) {
  // Set enrollment ID
  document.getElementById("modalEnrollmentId").value = enrollmentId;

  // Set SOS Date if exists
  const dateField = document.getElementById("SOSDate");
  if (currentDate) {
    dateField.value = currentDate;
  } else {
    dateField.value = "";
  }

  // Set SOS Reason if exists
  const reasonField = document.getElementById("SOSReason");
  if (currentReason && currentReason !== "--------") {
    reasonField.value = currentReason;
  } else {
    reasonField.value = "";
  }

  // Update modal title based on whether SOS exists
  const modalTitle = document.getElementById("modalTitle");
  if (currentDate) {
    modalTitle.textContent = "Update SOS Details";
  } else {
    modalTitle.textContent = "Add SOS Details";
  }

  document.getElementById("SOSModal").classList.add("active");
}

function closeSOSModal() {
  document.getElementById("SOSModal").classList.remove("active");
}

document.getElementById("SOSForm").addEventListener("submit", function (e) {
  const enrollmentId = document.getElementById("modalEnrollmentId").value;
  this.action = "/applicant/" + enrollmentId + "/addSOS";
});

document.getElementById("SOSModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeSOSModal();
  }
});
