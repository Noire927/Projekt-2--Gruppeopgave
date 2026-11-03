// Get clothing recommendations from the server
async function getClothingRecommendations() {
  const response = await fetch("/api/clothing");

  if (!response.ok) {
    throw new Error("Could not load clothing recommendations");
  }

  const clothingData = await response.json();

  console.log(clothingData);
}

getClothingRecommendations();
