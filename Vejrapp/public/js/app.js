// Load this script last, after the shared state and feature functions.
/*
 * Startup input: the HTML is already parsed because all these scripts use defer.
 * Restore saved preferences before binding controls and making the first weather request.
 * Choice: ordinary ordered scripts fit this small project without an import/build setup.
 * elements.js resolves the nodes first, base.js creates state, and app.js runs last.
 */
loadPreferences();
setupPreferences();

elements.cityInput.value = selectedCity.name;
elements.cityForm.onsubmit = searchCities;
elements.locationButton.onclick = detectLocation;
elements.retryWeatherButton.onclick = getWeather;
/*
 * Open-preferences click callback: no declared inputs; fill the form/drafts from applied
 * settings, clear an earlier dialog warning, then open the native dialog.
 * Output: return undefined; change dialog fields and visibility, not saved preferences.
 * Choice: the native dialog supplies modal focus handling and Escape-to-close behavior.
 */
elements.preferencesButton.onclick = function () {
    fillPreferences();
    elements.preferencesMessage.textContent = "";
    elements.preferencesDrawer.showModal();
};
/*
 * Close-preferences click callback: no declared inputs; close the native dialog.
 * Output: return undefined. Draft choices are not applied or saved; the next opening refills
 * them from preferences, so closing can be used to discard edits.
 */
elements.closePreferencesButton.onclick = function () { elements.preferencesDrawer.close(); };

/*
 * Input: true for the hourly forecast, false for the seven-day forecast.
 * How: switch the two panels' hidden flags and the buttons' aria-pressed values.
 * Output: return undefined; show the chosen forecast and expose its selected state accessibly.
 * Choice: both lists are already fetched, so this switch needs no network request.
 */
function switchForecast(hourly) {
    elements.hourlyPanel.hidden = !hourly;
    elements.dailyPanel.hidden = hourly;
    elements.dailyButton.setAttribute("aria-pressed", String(!hourly));
    elements.hourlyButton.setAttribute("aria-pressed", String(hourly));
}
/*
 * These click callbacks ignore the browser event and pass false/true to switchForecast.
 * They return undefined; switchForecast performs the panel and button-state updates.
 */
elements.dailyButton.onclick = function () { switchForecast(false); };
elements.hourlyButton.onclick = function () { switchForecast(true); };

/*
 * Initial weather output is requested as soon as the page is wired up; no login is required.
 * Later city choices and the retry button reuse the same getWeather function.
 */
getWeather();
