const authForm = document.querySelector("#signup-form, #login-form");
const authMessage = document.getElementById("auth-message");

authForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const button = authForm.querySelector('button[type="submit"]');
  button.disabled = true;
  authMessage.textContent = "";

  try {
    const userData = Object.fromEntries(new FormData(authForm));
    userData.email = userData.email.trim();
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    };

    if (authForm.id === "signup-form") {
      const response = await fetch("/api/register", options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Kunne ikke oprette brugeren.");
      }
    }

    const response = await fetch("/api/login", options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Kunne ikke logge ind.");
    }
    if (typeof data?.token !== "string" || !data.token.trim()) {
      throw new Error("Serveren returnerede ikke et login-token.");
    }

    sessionStorage.setItem("token", data.token);
    const preferencesResponse = await fetch("/api/preferences", {
      headers: { Authorization: "Bearer " + data.token },
    });
    if (preferencesResponse.status === 401) {
      sessionStorage.removeItem("token");
      window.location.href = "login-form.html";
      return;
    }
    const preferences = await preferencesResponse.json();
    if (!preferencesResponse.ok) {
      throw new Error(typeof preferences?.error === "string"
        ? preferences.error : "Kunne ikke hente dine præferencer.");
    }

    const completeProfile = ["barn", "voksen"].includes(preferences?.ageGroup)
      && ["male", "female", "other"].includes(preferences?.gender)
      && ["classy", "slutty"].includes(preferences?.style);
    if (!completeProfile) {
      window.location.href = authForm.dataset.next;
      return;
    }
    window.location.href = preferences.ageGroup === "barn"
      ? "weather-child.html" : "weather-adult.html";
  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
