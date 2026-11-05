const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");

profileForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const button = profileForm.querySelector('button[type="submit"]');
  button.disabled = true;
  profileMessage.textContent = "";

  try {
    const token = sessionStorage.getItem("token");
    if (!token) {
      window.location.href = "login-form.html";
      return;
    }

    const formData = new FormData(profileForm);
    const preferences = {
      ageGroup: Number(formData.get("age")) < 18 ? "barn" : "voksen",
      gender: formData.get("gender"),
      style: formData.get("style"),
    };
    const response = await fetch("/api/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(preferences),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Kunne ikke gemme dine præferencer.");
    }

    window.location.href = preferences.ageGroup === "barn"
      ? profileForm.dataset.nextChild : profileForm.dataset.nextAdult;
  } catch (error) {
    profileMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
