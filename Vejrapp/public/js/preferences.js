// Preferences are local to this browser; no account or server API is needed.
/*
 * These arrays hold temporary answers; cardNumber tracks the current card position.
 * They are separate from preferences, so clicking cards does not apply changes immediately.
 * fillPreferences replaces these drafts whenever the dialog opens.
 */
let likedClothes = [];
let dislikedClothes = [];
let cardNumber = 0;

/*
 * Input: no arguments; read the JSON string under "weather-preferences" in localStorage.
 * How: parse saved settings, keep supported age/sensitivity choices and saved arrays,
 * and restore a city when its name and numeric coordinates are present.
 * Array item IDs are not checked. Missing data uses the initial defaults.
 * Output: return undefined; update the shared preferences and selectedCity variables.
 * A storage/JSON error writes a warning to elements.message; startup can still fetch weather.
 * Choice: localStorage persists settings for this browser/site across visits; tab-only
 * sessionStorage would not provide the same persistence after that tab's session ends.
 * The small type checks prevent unusable saved values from breaking array or weather operations.
 */
function loadPreferences() {
    try {
        let saved = JSON.parse(localStorage.getItem("weather-preferences"));
        if (!saved) return;
        preferences.ageGroup = saved.ageGroup === "child" ? "child" : "adult";
        preferences.temperaturePreference = ["cold", "warm"].includes(saved.temperaturePreference) ? saved.temperaturePreference : "comfortable";
        preferences.likedClothes = Array.isArray(saved.likedClothes) ? saved.likedClothes : [];
        preferences.dislikedClothes = Array.isArray(saved.dislikedClothes) ? saved.dislikedClothes : [];
        if (saved.city && typeof saved.city.name === "string" && Number.isFinite(saved.city.lat) && Number.isFinite(saved.city.lon)) selectedCity = saved.city;
    } catch {
        elements.message.textContent = "Could not load saved preferences. Using general recommendations.";
    }
}

/*
 * Input: no arguments; read the applied preferences and selectedCity from shared state.
 * How: serialize both into one JSON value and write it to localStorage's "weather-preferences".
 * Output: return true and clear elements.message on success; return false and show a warning
 * there if storage is blocked or full. In-memory choices still work for this visit.
 * Choice: one saved value keeps the city and clothing settings together without a backend.
 * This function saves applied state; it does not copy unsaved dialog fields into preferences.
 */
function savePreferences() {
    try {
        localStorage.setItem("weather-preferences", JSON.stringify({ ...preferences, city: selectedCity }));
        elements.message.textContent = "";
        return true;
    } catch {
        elements.message.textContent = "Your changes work for this visit, but could not be saved in this browser.";
        return false;
    }
}

/*
 * Input: no arguments; read the applied preferences and selectedCity.
 * How: fill the dialog's select controls and preferred-city text, copy both preference arrays
 * with slice(), reset cardNumber to zero, and call showCard.
 * Output: return undefined; update the dialog and temporary draft answers only.
 * Choice: shallow array copies are enough for string IDs and keep discarded edits out of
 * the applied preferences. This function does not read or write browser storage.
 */
function fillPreferences() {
    elements.ageGroupSelect.value = preferences.ageGroup;
    elements.sensitivitySelect.value = preferences.temperaturePreference;
    elements.preferredCity.textContent = selectedCity.name;
    likedClothes = preferences.likedClothes.slice();
    dislikedClothes = preferences.dislikedClothes.slice();
    cardNumber = 0;
    showCard();
}

/*
 * Input: no arguments; elements supplies the form and clothing-card buttons.
 * How: attach the submit/click callbacks below. This prepares controls; it does not submit
 * the form or show the dialog by itself.
 * Output: return undefined; assign event handlers to the existing elements.
 * Choice: register the handlers once at startup, and refill their values only when opened.
 */
function setupPreferences() {
    /*
     * Submit callback input: the browser's form event. preventDefault stops page navigation.
     * Read the select controls and draft arrays into the applied preferences; refresh the
     * clothing advice from currentWeather if available, then attempt local storage saving.
     * Output: return undefined. Close the dialog after a successful save; otherwise keep it
     * open and copy the storage warning to elements.preferencesMessage.
     * Choice: apply settings in memory before saving so personalization also works without storage.
     */
    elements.preferencesForm.onsubmit = function (event) {
        event.preventDefault();
        preferences = {
            ageGroup: elements.ageGroupSelect.value,
            temperaturePreference: elements.sensitivitySelect.value,
            likedClothes: likedClothes, dislikedClothes: dislikedClothes
        };
        if (currentWeather) showClothing(currentWeather);
        if (savePreferences()) elements.preferencesDrawer.close();
        else elements.preferencesMessage.textContent = elements.message.textContent;
    };
    /*
     * These three click callbacks need no declared parameters and return undefined.
     * They pass "like", "dislike" or "skip" to answerCard, which updates the draft and card.
     * Choice: fixed button answers keep the shared card logic in one function.
     */
    elements.likeButton.onclick = function () { answerCard("like"); };
    elements.dislikeButton.onclick = function () { answerCard("dislike"); };
    elements.skipCardButton.onclick = function () { answerCard("skip"); };
}

/*
 * Input: no arguments; read cardNumber, cards and the clothing-name map.
 * How: display the current item and its position, or a completion message after the last one.
 * Output: return undefined; update elements.clothingCard, hide/show cardButtons, and focus
 * saveButton once the cards are finished. Nothing is applied or saved here.
 * Choice: text plus ordinary buttons is enough for the preference game without swipe code.
 */
function showCard() {
    let finished = cardNumber === cards.length;
    elements.cardButtons.hidden = finished;
    elements.clothingCard.textContent = finished
        ? "All done! Save your preferences."
        : (cardNumber + 1) + " / " + cards.length + ": " + clothes[cards[cardNumber]];
    if (finished) elements.saveButton.focus();
}

/*
 * Input: "like", "dislike" or "skip" from a clothing-card button.
 * How: stop if no cards remain; get the current clothing ID and advance cardNumber.
 * Filter that ID out of both drafts, add it to the chosen draft for like/dislike, then showCard.
 * The filter callbacks take one stored ID and return true only for IDs to keep.
 * Output: return undefined; update draft arrays and the next card, not preferences or storage.
 * Choice: removing the old answer first avoids duplicates and lets skip clear an earlier answer.
 */
function answerCard(answer) {
    if (cardNumber >= cards.length) return;
    let id = cards[cardNumber++];
    likedClothes = likedClothes.filter(item => item !== id);
    dislikedClothes = dislikedClothes.filter(item => item !== id);
    if (answer === "like") likedClothes.push(id);
    if (answer === "dislike") dislikedClothes.push(id);
    showCard();
}
