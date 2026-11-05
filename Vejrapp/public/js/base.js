// Shared state for weather and clothing preferences.
/*
 * Shared inputs used by the feature scripts, not a saved user account.
 * preferences holds the applied clothing settings. Defaults work without browser storage.
 * currentWeather caches the latest successful current-weather object so changing clothes
 * preferences can update the advice without another weather request. null means none loaded.
 * selectedCity holds a display name and numeric latitude/longitude; Aarhus is the default.
 * Choice: a few shared variables and ordered defer scripts keep this small project simple.
 * Changing these variables alone does not save them; savePreferences performs that step.
 */
let preferences = {
    ageGroup: "adult", temperaturePreference: "comfortable",
    likedClothes: [], dislikedClothes: []
};
let currentWeather = null;
let selectedCity = { name: "Aarhus", lat: 56.1629, lon: 10.2039 };
