const calendarEl = document.getElementById("holidayCalendar");
    const holidayData = JSON.parse(calendarEl.dataset.holidays || "[]");

    const calendarEvents = holidayData.map((holiday) => ({
      title: holiday.Occasion,
      start: new Date(holiday.date).toISOString().split("T")[0]
    }));

    const yearVal = window.yearVal
    const today = new Date();
    const initialDate = (today.getFullYear() === yearVal)
      ? today.toISOString().split("T")[0]
      : `${yearVal}-01-01`;

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      initialDate: initialDate,
      height: "100%",
      headerToolbar: {
        left: "prev",
        center: "title",
        right: "next"
      },
      buttonText: {
        prev: "‹",
        next: "›"
      },
      events: calendarEvents,
      eventDisplay: "block",
      dayMaxEvents: 2
    });

    calendar.render();

    /* ================= VIEW HOLIDAYS MODAL ================= */
    const viewHolidaysBtn = document.getElementById("viewHolidaysBtn");
    const viewHolidaysModal = document.getElementById("viewHolidaysModal");
    const closeViewHolidaysModal = document.getElementById("closeViewHolidaysModal");
    const closeViewHolidaysBtn = document.getElementById("closeViewHolidaysBtn");

    function closeViewModal() {
      viewHolidaysModal.classList.remove("active");
    }

    viewHolidaysBtn.addEventListener("click", () => {
      viewHolidaysModal.classList.add("active");
    });

    closeViewHolidaysModal.addEventListener("click", closeViewModal);
    closeViewHolidaysBtn.addEventListener("click", closeViewModal);

    viewHolidaysModal.addEventListener("click", (event) => {
      if (event.target === viewHolidaysModal) {
        closeViewModal();
      }
    });

    /* ================= ADD HOLIDAY MODAL ================= */
    const addHolidayBtn = document.getElementById("addHolidayBtn");
    const holidayModal = document.getElementById("holidayModal");
    const closeHolidayModal = document.getElementById("closeHolidayModal");
    const cancelHolidayBtn = document.getElementById("cancelHolidayBtn");
    const saveHolidayBtn = document.getElementById("saveHolidayBtn");

    function closeAddModal() {
      holidayModal.classList.remove("active");
    }

    addHolidayBtn.addEventListener("click", () => {
      holidayModal.classList.add("active");
    });

    closeHolidayModal.addEventListener("click", closeAddModal);
    cancelHolidayBtn.addEventListener("click", closeAddModal);

    holidayModal.addEventListener("click", (event) => {
      if (event.target === holidayModal) {
        closeAddModal();
      }
    });

    saveHolidayBtn.addEventListener("click", async () => {
      const date = document.getElementById("holidayDate").value;
      const occasion = document.getElementById("holidayOccasion").value.trim();

      if (!date || !occasion) {
        alert("Please enter date and occasion.");
        return;
      }

      try {
        const response = await fetch(`/year/${window.yearId}/holidays`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ date, occasion })
        });

        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to add holiday (it may already exist).");
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong.");
      }
    });

    /* ================= EDIT HOLIDAY MODAL ================= */
    const editHolidayModal = document.getElementById("editHolidayModal");
    const closeEditHolidayModal = document.getElementById("closeEditHolidayModal");
    const cancelEditHolidayBtn = document.getElementById("cancelEditHolidayBtn");
    const updateHolidayBtn = document.getElementById("updateHolidayBtn");

    let editingHolidayId = null;

    document.querySelectorAll(".edit-holiday-btn").forEach((button) => {
      button.addEventListener("click", () => {
        editingHolidayId = button.dataset.id;
        document.getElementById("editHolidayDate").value = button.dataset.date;
        document.getElementById("editHolidayOccasion").value = button.dataset.occasion;
        editHolidayModal.classList.add("active");
      });
    });

    function closeEditModal() {
      editHolidayModal.classList.remove("active");
      editingHolidayId = null;
    }

    closeEditHolidayModal.addEventListener("click", closeEditModal);
    cancelEditHolidayBtn.addEventListener("click", closeEditModal);

    editHolidayModal.addEventListener("click", (event) => {
      if (event.target === editHolidayModal) {
        closeEditModal();
      }
    });

    updateHolidayBtn.addEventListener("click", async () => {
      const date = document.getElementById("editHolidayDate").value;
      const occasion = document.getElementById("editHolidayOccasion").value.trim();

      if (!date || !occasion) {
        alert("Please enter date and occasion.");
        return;
      }

      if (!editingHolidayId) {
        alert("Holiday ID is missing.");
        return;
      }

      try {
        const response = await fetch(
          `/year/${window.yearId}/holidays/${editingHolidayId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ date, occasion })
          }
        );

        if (response.ok) {
          window.location.reload();
        } else {
          alert("Failed to update holiday.");
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong.");
      }
    });