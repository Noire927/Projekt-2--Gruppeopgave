const signupForm = document.querySelector(".js-signup-form");

signupForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(signupForm);
  const userData = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    alert("Registration successful!");

    window.location.href = signupForm.dataset.next;
  } catch (error) {
    alert(error.message || "Something went wrong during registration.");
  }
});
