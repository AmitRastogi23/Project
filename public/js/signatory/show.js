const form = document.getElementById("authorityForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fields = form.querySelectorAll(".authority-field");

  const authorities = Array.from(fields).map((field) => {
    return {
      key: field.querySelector(".authority-key").value,
      designation: field.querySelector(".authority-designation").value.trim(),
      name: field.querySelector(".authority-name").value.trim(),
    };
  });

  try {
    message.textContent = "Saving...";
    message.className = "authorities-message";

    const response = await fetch("/signatory", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ authorities }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update authorities");
    }

    message.textContent = "Authorities updated successfully.";
    message.className = "authorities-message success";
  } catch (error) {
    console.error("Update authorities error:", error);
    message.textContent = error.message || "Failed to update authorities.";
    message.className = "authorities-message error";
  }
});
