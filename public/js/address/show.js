document.addEventListener("DOMContentLoaded", () => {
  // Delete modal
  const deleteModal = document.getElementById("deleteModal");
  const modalAddressName = document.getElementById("modalAddressName");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  let pendingDeleteId = null;

  // Edit modal
  const editModal = document.getElementById("editModal");
  const closeEditModalBtn = document.getElementById("closeEditModal");
  const cancelEditBtn = document.getElementById("cancelEdit");
  const editForm = document.getElementById("editForm");
  const saveEditBtn = document.getElementById("saveEdit");

  // Add modal
  const addModal = document.getElementById("addModal");
  const openAddModalBtn = document.getElementById("openAddModal");
  const closeAddModalBtn = document.getElementById("closeAddModal");
  const cancelAddBtn = document.getElementById("cancelAdd");
  const addForm = document.getElementById("addForm");
  const saveAddBtn = document.getElementById("saveAdd");

  /* ═════════════════════════════════════════
     DELETE FLOW
     ═════════════════════════════════════════ */
  document.querySelectorAll(".icon-btn.delete").forEach((btn) => {
    btn.addEventListener("click", function () {
      pendingDeleteId = this.dataset.id;
      if (modalAddressName) modalAddressName.textContent = this.dataset.name;
      deleteModal.classList.add("active");
    });
  });

  function closeDeleteModal() {
    deleteModal.classList.remove("active");
    pendingDeleteId = null;
  }

  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  deleteModal.addEventListener("click", function (e) {
    if (e.target === this) closeDeleteModal();
  });

  confirmDeleteBtn.addEventListener("click", async function () {
    if (!pendingDeleteId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deleting...";

    try {
      const response = await fetch(`/address/${pendingDeleteId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        closeDeleteModal();
        location.reload();
      } else {
        alert(result.message || "Failed to delete address");
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Delete";
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting address: " + error.message);
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = "Delete";
    }
  });

  /* ═════════════════════════════════════════
     EDIT FLOW
     ═════════════════════════════════════════ */
  document.querySelectorAll(".icon-btn.edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      const row = this.closest("tr");
      if (!row) return;

      const cells = row.querySelectorAll("td");
      // Order: sno(0), name(1), type(2), address(3), phone(4), email(5), actions(6)

      const name =
        cells[1].querySelector(".name-text")?.textContent.trim() || "";
      const type = cells[2].textContent.trim();
      const address = cells[3].textContent.trim();
      const phone = cells[4].textContent.trim();
      const email = cells[5].textContent.trim();

      document.getElementById("editId").value = this.dataset.id;
      document.getElementById("editType").value = type;
      document.getElementById("editName").value = name;
      document.getElementById("editAddress").value =
        address === "—" ? "" : address;
      document.getElementById("editPhone").value = phone === "—" ? "" : phone;
      document.getElementById("editEmail").value = email === "—" ? "" : email;

      editModal.classList.add("active");
    });
  });

  function closeEditModal() {
    editModal.classList.remove("active");
    editForm.reset();
    saveEditBtn.disabled = false;
    saveEditBtn.textContent = "Save Changes";
  }

  closeEditModalBtn.addEventListener("click", closeEditModal);
  cancelEditBtn.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", function (e) {
    if (e.target === this) closeEditModal();
  });

  editForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    if (!id) return;

    const type = document.getElementById("editType").value;
    const name = document.getElementById("editName").value.trim();
    const address = document.getElementById("editAddress").value.trim();

    if (!type) {
      alert("Type is required");
      return;
    }
    if (!name) {
      alert("Name is required");
      return;
    }
    if (!address) {
      alert("Address is required");
      return;
    }

    const payload = {
      type,
      name,
      address,
      phone: document.getElementById("editPhone").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
    };

    saveEditBtn.disabled = true;
    saveEditBtn.textContent = "Saving...";

    try {
      const response = await fetch(`/address/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        closeEditModal();
        location.reload();
      } else {
        alert(result.message || "Failed to update address");
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = "Save Changes";
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("Error updating address: " + error.message);
      saveEditBtn.disabled = false;
      saveEditBtn.textContent = "Save Changes";
    }
  });

  /* ═════════════════════════════════════════
     ADD FLOW
     ═════════════════════════════════════════ */
  openAddModalBtn.addEventListener("click", function () {
    addModal.classList.add("active");
  });

  function closeAddModal() {
    addModal.classList.remove("active");
    addForm.reset();
    saveAddBtn.disabled = false;
    saveAddBtn.textContent = "Add Address";
  }

  closeAddModalBtn.addEventListener("click", closeAddModal);
  cancelAddBtn.addEventListener("click", closeAddModal);
  addModal.addEventListener("click", function (e) {
    if (e.target === this) closeAddModal();
  });

  addForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const type = document.getElementById("addType").value;
    const name = document.getElementById("addName").value.trim();
    const address = document.getElementById("addAddress").value.trim();

    if (!type) {
      alert("Type is required");
      return;
    }
    if (!name) {
      alert("Name is required");
      return;
    }
    if (!address) {
      alert("Address is required");
      return;
    }

    const payload = {
      type,
      name,
      address,
      phone: document.getElementById("addPhone").value.trim(),
      email: document.getElementById("addEmail").value.trim(),
    };

    saveAddBtn.disabled = true;
    saveAddBtn.textContent = "Adding...";

    try {
      const response = await fetch(`/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        closeAddModal();
        location.reload();
      } else {
        alert(result.message || "Failed to add address");
        saveAddBtn.disabled = false;
        saveAddBtn.textContent = "Add Address";
      }
    } catch (error) {
      console.error("Add error:", error);
      alert("Error adding address: " + error.message);
      saveAddBtn.disabled = false;
      saveAddBtn.textContent = "Add Address";
    }
  });

  /* ═════════════════════════════════════════
     ESC to close any modal
     ═════════════════════════════════════════ */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (deleteModal.classList.contains("active")) closeDeleteModal();
    if (editModal.classList.contains("active")) closeEditModal();
    if (addModal.classList.contains("active")) closeAddModal();
  });
});
