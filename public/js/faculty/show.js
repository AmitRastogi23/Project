document.addEventListener("DOMContentLoaded", async () => {
  // ── References ──
  const facultyBody = document.getElementById("facultyBody");
  const filterBar = document.getElementById("filterBar");
  const tableContainer = document.getElementById("tableContainer");
  const loadingState = document.getElementById("loadingState");
  const noDataState = document.getElementById("noDataState");
  const emptyState = document.getElementById("filterEmpty");
  const totalCountEl = document.getElementById("totalCount");
  const totalOrgsEl = document.getElementById("totalOrgs");

  // Modal refs
  const deleteModal = document.getElementById("deleteModal");
  const modalFacultyName = document.getElementById("modalFacultyName");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  let pendingDeleteId = null;

  const editModal = document.getElementById("editModal");
  const closeEditModalBtn = document.getElementById("closeEditModal");
  const cancelEditBtn = document.getElementById("cancelEdit");
  const editForm = document.getElementById("editForm");
  const saveEditBtn = document.getElementById("saveEdit");

  const addModal = document.getElementById("addModal");
  const openAddModalBtn = document.getElementById("openAddModal");
  const closeAddModalBtn = document.getElementById("closeAddModal");
  const cancelAddBtn = document.getElementById("cancelAdd");
  const addForm = document.getElementById("addForm");
  const saveAddBtn = document.getElementById("saveAdd");

  let allFaculties = [];

  // ═════════════════════════════════════════
  // FETCH FACULTIES & RENDER TABLE
  // ═════════════════════════════════════════
  async function loadFaculties() {
    loadingState.style.display = "block";
    tableContainer.style.display = "none";
    noDataState.style.display = "none";

    try {
      const res = await fetch("/faculty/api/list");
      const data = await res.json();

      loadingState.style.display = "none";

      if (!data.success || !data.faculties || data.faculties.length === 0) {
        noDataState.style.display = "block";
        totalCountEl.textContent = "0";
        totalOrgsEl.textContent = "0";
        return;
      }

      allFaculties = data.faculties;
      tableContainer.style.display = "block";
      renderTable(allFaculties);
      renderFilters(allFaculties);
      updateStats(allFaculties);
    } catch (err) {
      console.error("Failed to load faculties:", err);
      loadingState.style.display = "none";
      noDataState.style.display = "block";
    }
  }

  function updateStats(faculties) {
    totalCountEl.textContent = faculties.length;
    const orgs = new Set(faculties.map((f) => f.organization).filter(Boolean));
    totalOrgsEl.textContent = orgs.size;
  }

  function renderFilters(faculties) {
    const orgs = [
      ...new Set(faculties.map((f) => f.organization).filter(Boolean)),
    ];
    if (orgs.length === 0) {
      filterBar.style.display = "none";
      return;
    }
    filterBar.style.display = "flex";
    filterBar.innerHTML = `<button class="filter-btn active" data-org="all">All</button>`;
    orgs.forEach((org) => {
      filterBar.innerHTML += `<button class="filter-btn" data-org="${org}">${org}</button>`;
    });

    filterBar.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const org = btn.dataset.org;
        filterBar
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        let visibleCount = 0;
        facultyBody.querySelectorAll("tr").forEach((row) => {
          if (org === "all" || row.dataset.org === org) {
            row.style.display = "";
            visibleCount++;
          } else {
            row.style.display = "none";
          }
        });

        renumberRows();
        if (emptyState)
          emptyState.style.display = visibleCount === 0 ? "block" : "none";
      });
    });
  }

  function renderTable(faculties) {
    facultyBody.innerHTML = "";
    faculties.forEach((f, i) => {
      const tr = document.createElement("tr");
      tr.dataset.org = f.organization || "";
      tr.dataset.id = f._id;
      tr.dataset.name = f.name;

      tr.innerHTML = `
        <td class="col-sno">${i + 1}</td>
        <td class="col-name">
          <div class="name-cell">
            <span class="avatar">${(f.name || "").charAt(0).toUpperCase()}</span>
            <span class="name-text">${f.name}</span>
          </div>
        </td>
        <td class="col-rank">${f.rank || "—"}</td>
        <td class="col-org">${f.organization ? `<span class="org-tag">${f.organization}</span>` : '<span class="muted">—</span>'}</td>
        <td class="col-email">${f.email ? `<a href="mailto:${f.email}">${f.email}</a>` : '<span class="muted">—</span>'}</td>
        <td class="col-phone">${f.phone || "—"}</td>
        <td class="col-address">${f.address || "—"}</td>
        <td class="col-guest">${f.isGuestFaculty ? '<span class="pill pill-success">Yes</span>' : '<span class="pill pill-muted">No</span>'}</td>
        <td class="col-retd">${f.isRetired ? '<span class="pill pill-warning">Yes</span>' : '<span class="pill pill-muted">No</span>'}</td>
        <td class="col-action">
          <div class="action-group">
            <button class="icon-btn edit" title="Edit" data-id="${f._id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="icon-btn delete" title="Delete" data-id="${f._id}" data-name="${f.name}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      facultyBody.appendChild(tr);
    });
    attachTableEvents();
  }

  function renumberRows() {
    let sno = 1;
    facultyBody.querySelectorAll("tr").forEach((row) => {
      if (row.style.display !== "none") {
        const cell = row.querySelector(".col-sno");
        if (cell) cell.textContent = sno++;
      }
    });
  }

  // ═════════════════════════════════════════
  // TABLE EVENTS (Edit / Delete)
  // ═════════════════════════════════════════
  function attachTableEvents() {
    // Delete
    facultyBody.querySelectorAll(".icon-btn.delete").forEach((btn) => {
      btn.addEventListener("click", function () {
        pendingDeleteId = this.dataset.id;
        if (modalFacultyName) modalFacultyName.textContent = this.dataset.name;
        deleteModal.classList.add("active");
      });
    });

    // Edit
    facultyBody.querySelectorAll(".icon-btn.edit").forEach((btn) => {
      btn.addEventListener("click", function () {
        const row = this.closest("tr");
        if (!row) return;
        const id = this.dataset.id;
        const fac = allFaculties.find((f) => f._id === id);
        if (!fac) return;

        document.getElementById("editId").value = fac._id;
        document.getElementById("editName").value = fac.name || "";
        document.getElementById("editRank").value = fac.rank || "";
        document.getElementById("editOrganization").value =
          fac.organization || "";
        document.getElementById("editEmail").value = fac.email || "";
        document.getElementById("editPhone").value = fac.phone || "";
        document.getElementById("editAddress").value = fac.address || "";

        const guestRadio = document.querySelector(
          `input[name="editGuest"][value="${fac.isGuestFaculty}"]`,
        );
        const retiredRadio = document.querySelector(
          `input[name="editRetired"][value="${fac.isRetired}"]`,
        );
        if (guestRadio) guestRadio.checked = true;
        if (retiredRadio) retiredRadio.checked = true;

        editModal.classList.add("active");
      });
    });
  }

  // ═════════════════════════════════════════
  // DELETE FLOW
  // ═════════════════════════════════════════
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
      const response = await fetch(`/faculty/${pendingDeleteId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        closeDeleteModal();
        loadFaculties();
      } else {
        alert(result.message || "Failed to delete faculty");
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Delete";
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting faculty: " + error.message);
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = "Delete";
    }
  });

  // ═════════════════════════════════════════
  // EDIT FLOW
  // ═════════════════════════════════════════
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

    const name = document.getElementById("editName").value.trim();
    if (!name) {
      alert("Name is required");
      return;
    }

    const guestChecked = document.querySelector(
      'input[name="editGuest"]:checked',
    );
    const retiredChecked = document.querySelector(
      'input[name="editRetired"]:checked',
    );

    const payload = {
      name,
      rank: document.getElementById("editRank").value.trim(),
      organization: document.getElementById("editOrganization").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      phone: document.getElementById("editPhone").value.trim(),
      address: document.getElementById("editAddress").value.trim(),
      isGuestFaculty: guestChecked ? guestChecked.value === "true" : false,
      isRetired: retiredChecked ? retiredChecked.value === "true" : false,
    };

    saveEditBtn.disabled = true;
    saveEditBtn.textContent = "Saving...";

    try {
      const response = await fetch(`/faculty/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        closeEditModal();
        loadFaculties();
      } else {
        alert(result.message || "Failed to update faculty");
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = "Save Changes";
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("Error updating faculty: " + error.message);
      saveEditBtn.disabled = false;
      saveEditBtn.textContent = "Save Changes";
    }
  });

  // ═════════════════════════════════════════
  // ADD FLOW
  // ═════════════════════════════════════════
  openAddModalBtn.addEventListener("click", function () {
    addModal.classList.add("active");
  });

  function closeAddModal() {
    addModal.classList.remove("active");
    addForm.reset();
    saveAddBtn.disabled = false;
    saveAddBtn.textContent = "Add Faculty";
  }
  closeAddModalBtn.addEventListener("click", closeAddModal);
  cancelAddBtn.addEventListener("click", closeAddModal);
  addModal.addEventListener("click", function (e) {
    if (e.target === this) closeAddModal();
  });

  addForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("addName").value.trim();
    if (!name) {
      alert("Name is required");
      return;
    }

    const guestChecked = document.querySelector(
      'input[name="addGuest"]:checked',
    );
    const retiredChecked = document.querySelector(
      'input[name="addRetired"]:checked',
    );

    const payload = {
      name,
      rank: document.getElementById("addRank").value.trim(),
      organization: document.getElementById("addOrganization").value.trim(),
      email: document.getElementById("addEmail").value.trim(),
      phone: document.getElementById("addPhone").value.trim(),
      address: document.getElementById("addAddress").value.trim(),
      isGuestFaculty: guestChecked ? guestChecked.value === "true" : false,
      isRetired: retiredChecked ? retiredChecked.value === "true" : false,
    };

    saveAddBtn.disabled = true;
    saveAddBtn.textContent = "Adding...";

    try {
      const response = await fetch(`/faculty`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        closeAddModal();
        loadFaculties();
      } else {
        alert(result.message || "Failed to add faculty");
        saveAddBtn.disabled = false;
        saveAddBtn.textContent = "Add Faculty";
      }
    } catch (error) {
      console.error("Add error:", error);
      alert("Error adding faculty: " + error.message);
      saveAddBtn.disabled = false;
      saveAddBtn.textContent = "Add Faculty";
    }
  });

  // ═════════════════════════════════════════
  // ESC KEY
  // ═════════════════════════════════════════
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (deleteModal.classList.contains("active")) closeDeleteModal();
    if (editModal.classList.contains("active")) closeEditModal();
    if (addModal.classList.contains("active")) closeAddModal();
  });

  // ═════════════════════════════════════════
  // INITIAL LOAD
  // ═════════════════════════════════════════
  loadFaculties();
});
