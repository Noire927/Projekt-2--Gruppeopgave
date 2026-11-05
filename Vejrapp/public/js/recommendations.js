// Get clothing recommendations from the server
let latestClothingRequest = 0;

async function getClothingRecommendations() {
  const request = ++latestClothingRequest;
  const adviceText = document.getElementById("advice-text");
  const city = document.getElementById("city-input").value.trim()
    || document.getElementById("city-name").textContent.trim();

  adviceText.textContent = "Henter tøjråd...";

  try {
    const token = sessionStorage.getItem("token");
    const response = await fetch("/api/clothing?city=" + encodeURIComponent(city), {
      headers: token ? { Authorization: "Bearer " + token } : {},
    });
    const clothingData = await response.json();

    if (!response.ok) {
      throw new Error(typeof clothingData?.error === "string"
        ? clothingData.error : "Kunne ikke hente tøjråd. Prøv igen.");
    }

    if (typeof clothingData?.recommendation !== "string" || !clothingData.recommendation.trim()) {
      throw new Error("Serveren returnerede ikke noget tøjråd.");
    }

    if (request === latestClothingRequest) adviceText.innerHTML = clothingData.recommendation;
  } catch (error) {
    if (request === latestClothingRequest) adviceText.textContent = error.message;
  }
}

document.querySelector(".js-search-form").addEventListener("submit", function (event) {
  event.preventDefault();
  return getClothingRecommendations();
});

getClothingRecommendations();
