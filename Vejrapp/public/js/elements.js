// Change IDs here to match your HTML. Every other script reads from elements.
// If all your HTML IDs share a prefix, change this value to match that prefix.
/*
 * Configuration input: idPrefix and each elementIds value must match the existing HTML IDs.
 * Each entry pairs a readable JavaScript name with its actual HTML ID. An entry can also
 * use a complete custom ID, such as cityInput: "my-location-input", instead of the prefix.
 * Choice: one map avoids repeating DOM lookup strings throughout all the feature files.
 * The map does not rename HTML: labels' for attributes and ARIA references must match too.
 */
const idPrefix = "replace_this_id_with_real_id";
const elementIds = {
    preferencesButton: idPrefix + "_preferences_button",
    message: idPrefix + "_message",
    cityForm: idPrefix + "_city_form",
    cityInput: "city-input",
    locationButton: "locate-button",
    locationMessage: idPrefix + "_location_message",
    cityResults: idPrefix + "_city_results",
    weatherMessage: idPrefix + "_weather_message",
    retryWeatherButton: idPrefix + "_retry_weather_button",
    weatherPanel: idPrefix + "_weather_panel",
    weatherIcon: "weather-image",
    cityName: "city-name",
    temperature: "temperature",
    conditions: "condition",
    wind: idPrefix + "_wind",
    windSpeed: "wind",
    rain: "rain",
    clothingAdvice: "advice-text",
    clothingExtras: idPrefix + "_clothing_extras",
    dailyButton: "view-daily",
    hourlyButton: "view-hourly",
    dailyPanel: "forecast-daily",
    dailyList: "forecast-daily",
    hourlyPanel: "forecast-hourly",
    hourlyList: "forecast-hourly",
    forecastMessage: idPrefix + "_forecast_message",
    preferencesDrawer: idPrefix + "_preferences_drawer",
    closePreferencesButton: idPrefix + "_close_preferences_button",
    preferencesMessage: idPrefix + "_preferences_message",
    preferencesForm: idPrefix + "_preferences_form",
    ageGroupSelect: idPrefix + "_age_group_select",
    sensitivitySelect: idPrefix + "_sensitivity_select",
    preferredCity: idPrefix + "_preferred_city",
    clothingCard: idPrefix + "_clothing_card",
    cardButtons: idPrefix + "_card_buttons",
    likeButton: idPrefix + "_like_button",
    dislikeButton: idPrefix + "_dislike_button",
    skipCardButton: idPrefix + "_skip_card_button",
    saveButton: idPrefix + "_save_button"
};

/*
 * Startup step, not a function: read each configured ID and store its DOM node in elements.
 * Output: other scripts use references such as elements.cityInput and read its current value.
 * The defer attributes in index.html ensure the HTML exists before these lookups run.
 * Choice: keep references to the existing nodes because this app does not replace those nodes.
 * A missing or mismatched ID produces null, so the map and HTML must stay consistent.
 */
const elements = {};
for (const name in elementIds) {
    elements[name] = document.getElementById(elementIds[name]);
}
