// City search and the browser location permission.

/*
 * Search and device-location callbacks share this counter. Starting a new lookup or
 * selecting a city invalidates older callbacks so late results cannot change the choice.
 */
let latestLocation = 0;

/*
 * Input: a readable city/location name plus numeric latitude and longitude.
 * How: invalidate older location callbacks, replace selectedCity, update the search input,
 * clear search results/status, save the selected city with preferences, then fetch its weather.
 * Output: return getWeather's Promise, which resolves to undefined; the results appear in
 * the dashboard. A storage failure still allows the selected city's weather to load.
 * Choice: search-result clicks and device-location success use the same selection steps.
 */
function selectCity(name, lat, lon) {
    latestLocation++;
    selectedCity = { name: name, lat: lat, lon: lon };
    elements.cityInput.value = name;
    elements.cityResults.replaceChildren();
    elements.locationMessage.textContent = "";
    savePreferences();
    return getWeather();
}

/*
 * Input: the city form's submit event; read the trimmed query from elements.cityInput.
 * How: prevent navigation, reject queries shorter than two characters, and request up to five
 * English matches from Open-Meteo geocoding. Encode the query so spaces and & stay data.
 * Ignore stale results, skip unusable coordinates, and create a labelled button per match.
 * Output: return a Promise resolving to undefined; update elements.cityResults and
 * locationMessage. Clicking a result performs the separate selectCity action.
 * Choice: a submitted search avoids a request on every keystroke and lets the person choose
 * between same-named locations instead of silently selecting the first result.
 */
async function searchCities(event) {
    event.preventDefault();
    let request = ++latestLocation;
    let query = elements.cityInput.value.trim();
    elements.cityResults.replaceChildren();
    if (query.length < 2) { elements.locationMessage.textContent = "Enter at least two letters."; return; }
    elements.locationMessage.textContent = "Searching…";
    try {
        let response = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(query) + "&count=5&language=en&format=json");
        if (!response.ok) throw new Error("City search failed");
        let data = await response.json();
        if (request !== latestLocation) return;
        for (let city of data.results || []) {
            if (!city || !city.name || !Number.isFinite(city.latitude) || !Number.isFinite(city.longitude)) continue;
            let name = city.name + (city.country ? ", " + city.country : "");
            let item = document.createElement("li");
            let button = document.createElement("button");
            button.type = "button";
            button.textContent = name;
            /*
             * Result-click callback: no declared inputs; it captures this loop's name and city coordinates.
             * Output: return selectCity's weather Promise and update the selected location/dashboard.
             * Choice: the let variables retain the correct city for each result button.
             */
            button.onclick = function () { return selectCity(name, city.latitude, city.longitude); };
            item.appendChild(button);
            elements.cityResults.appendChild(item);
        }
        elements.locationMessage.textContent = elements.cityResults.children.length ? "Choose a city below." : "No cities found.";
    } catch {
        if (request === latestLocation) elements.locationMessage.textContent = "City search failed. Check your connection and try again.";
    }
}

// Browser permission and location timeout errors are useful to the user, so keep them.
/*
 * Input: no declared arguments; a button click asks the browser for device coordinates.
 * How: check geolocation support, mark a new location request, disable the button and call
 * getCurrentPosition with the success/error callbacks below. Permission belongs to the browser.
 * Output: return undefined immediately; it does not return coordinates or a Promise.
 * When the browser calls a callback, it updates locationMessage, re-enables the button,
 * and may fetch weather. An unanswered permission prompt can leave the button disabled.
 * Choice: ask only on a person's action. The options request a 20,000 ms position timeout
 * and allow cached positions up to 300,000 ms old to reduce waiting for a fresh reading.
 */
function detectLocation() {
    let button = elements.locationButton;
    if (!navigator.geolocation) { elements.locationMessage.textContent = "Location is unavailable. Search for a city instead."; return; }
    let request = ++latestLocation;
    button.disabled = true;
    elements.cityResults.replaceChildren();
    elements.locationMessage.textContent = "Finding your location…";
    /*
     * Success callback input: a browser position object with coords.latitude and coords.longitude.
     * How: re-enable the button; only the latest location request may call selectCity.
     * Output: return undefined; selectCity starts saving the choice and fetching its weather.
     * The position's coordinates are used directly; no reverse-geocoding request is needed.
     */
    navigator.geolocation.getCurrentPosition(function (position) {
        button.disabled = false;
        if (request === latestLocation) selectCity("Your location", position.coords.latitude, position.coords.longitude);
    }, function (error) {
        /*
         * Error callback input: the browser geolocation error; code 1 means permission denied,
         * 2 means unavailable position, and the remaining branch includes timeout (code 3).
         * How/output: re-enable the button, ignore stale errors, and show the matching guidance
         * in elements.locationMessage. Return undefined; the current city is not changed.
         */
        button.disabled = false;
        if (request !== latestLocation) return;
        if (error.code === 1) elements.locationMessage.textContent = "Allow location in your browser, or search for a city.";
        else if (error.code === 2) elements.locationMessage.textContent = "Your device could not find your location. Search for a city.";
        else elements.locationMessage.textContent = "Finding your location timed out. Try again or search for a city.";
    }, { timeout: 20000, maximumAge: 300000 });
}
