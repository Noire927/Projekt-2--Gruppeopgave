const loginForm = document.querySelector(".js-login-form");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(loginForm);

  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    localStorage.setItem("token", result.token);

    window.location.href = loginForm.dataset.next;
  } catch (error) {
    alert(error.message || "Login mislykkedes.");
  }
});
