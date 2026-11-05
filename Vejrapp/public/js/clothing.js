const swipeSection = document.querySelector(".js-swipe");

const cards = Array.from(swipeSection.querySelectorAll(".swipe__card"));

const counter = swipeSection.querySelector(".js-swipe-counter");
const likeButton = swipeSection.querySelector('[data-action="like"]');
const dislikeButton = swipeSection.querySelector('[data-action="dislike"]');

let currentIndex = 0;

const likedClothes = [];
const dislikedClothes = [];

// Show the selected clothing card
function showCard(index) {
  cards.forEach((card) => {
    card.classList.remove("swipe__card--current");
  });

  if (index < cards.length) {
    cards[index].classList.add("swipe__card--current");
    counter.textContent = index + 1;
  }
}

// Save the clothing choices
async function saveClothingPreferences() {
  const token = sessionStorage.getItem("token");

  const clothingPreferences = {
    likedClothes: likedClothes,
    dislikedClothes: dislikedClothes,
  };

  // Save guest choices in the browser
  if (!token) {
    sessionStorage.setItem(
      "clothingPreferences",
      JSON.stringify(clothingPreferences),
    );

    return;
  }

  // Get the user's existing preferences
  const getResponse = await fetch("/api/preferences", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!getResponse.ok) {
    throw new Error("Could not load user preferences.");
  }

  const existingPreferences = await getResponse.json();

  // Combine profile preferences with clothing choices
  const updatedPreferences = {
    ...existingPreferences,
    ...clothingPreferences,
  };

  // Save the updated preferences
  const saveResponse = await fetch("/api/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedPreferences),
  });

  if (!saveResponse.ok) {
    throw new Error("Could not save clothing preferences.");
  }
}

// Handle a like or dislike
async function chooseClothing(action) {
  const currentCard = cards[currentIndex];
  const itemId = currentCard.dataset.itemId;

  if (action === "like") {
    likedClothes.push(itemId);
  } else {
    dislikedClothes.push(itemId);
  }

  currentIndex++;

  if (currentIndex < cards.length) {
    showCard(currentIndex);
    return;
  }

  likeButton.disabled = true;
  dislikeButton.disabled = true;

  try {
    await saveClothingPreferences();

    window.location.href = swipeSection.dataset.next;
  } catch (error) {
    alert(error.message);

    likeButton.disabled = false;
    dislikeButton.disabled = false;
  }
}

// Connect the buttons
likeButton.addEventListener("click", () => {
  chooseClothing("like");
});

dislikeButton.addEventListener("click", () => {
  chooseClothing("dislike");
});

// Show the first card
showCard(0);
