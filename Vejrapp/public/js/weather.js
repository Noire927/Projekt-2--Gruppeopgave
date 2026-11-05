<<<<<<< Updated upstream
=======
// Find the message elements, forecast lists, HTML row template, and save location button.
const saveLocationButton = document.getElementById("save-location");
>>>>>>> Stashed changes
const weatherMessage = document.getElementById("weather-message");
const forecastMessage = document.getElementById("forecast-message");
const dailyForecast = document.getElementById("forecast-daily");
const hourlyForecast = document.getElementById("forecast-hourly");
<<<<<<< Updated upstream
let latestWeather = 0;
=======
const forecastTemplate = document.getElementById("forecast-row");

let latestWeather = 0;
let latestSuccessfulCity = "";
>>>>>>> Stashed changes

function formatNumber(value) {
  return Number.isFinite(value)
    ? value.toLocaleString("da-DK", { maximumFractionDigits: 1 }) : "—";
}

function setWeatherIcon(image, condition) {
  image.alt = condition?.description || "Vejret er ikke oplyst";
<<<<<<< Updated upstream
=======

  // Accept only known day (d) and night (n) icon codes.
>>>>>>> Stashed changes
  image.hidden = !/^(01|02|03|04|09|10|11|13|50)[dn]$/.test(condition?.icon);

  if (!image.hidden) {
    image.src = "https://openweathermap.org/payload/api/media/file/" + condition.icon + "@2x.png";
  }
<<<<<<< Updated upstream
=======

  image.onerror = function () {
    // Hide the image if the icon request fails.
    image.hidden = true;
  };
>>>>>>> Stashed changes
}

function showCurrentWeather(data, city) {
  if (!Number.isFinite(data?.main?.temp) || typeof data?.weather?.[0]?.description !== "string") {
    throw new Error("Serveren returnerede ikke gyldige vejrdata.");
  }

<<<<<<< Updated upstream
  document.getElementById("city-name").textContent = typeof data.name === "string" ? data.name : city;
  document.getElementById("temperature").textContent = formatNumber(data.main.temp) + " °C";
  document.getElementById("condition").textContent = data.weather[0].description;
  document.getElementById("feels-like").textContent = formatNumber(data.main.feels_like) + " °C";
  const wind = Number.isFinite(data.wind?.speed) ? data.wind.speed * 3.6 : NaN;
  document.getElementById("wind").textContent = formatNumber(wind) + " km/t";
  document.getElementById("rain").textContent = formatNumber(data.rain?.["1h"] ?? 0) + " mm";
=======
  document.getElementById("city-name").textContent =
    typeof data.name === "string" ? data.name : city;

  // Round temperatures and wind upward. HTML supplies the units.
  document.getElementById("temperature").textContent = Math.ceil(
    data.main.temp,
  );

  document.getElementById("condition").textContent =
    data.weather[0].description;

  document.getElementById("feels-like").textContent = Number.isFinite(
    data.main.feels_like,
  )
    ? Math.ceil(data.main.feels_like)
    : "—";

  const wind = data.wind?.speed;

  document.getElementById("wind").textContent = Number.isFinite(wind)
    ? Math.ceil(wind)
    : "—";

  const rain = data.rain?.["1h"] ?? 0;

  document.getElementById("rain").textContent = Number.isFinite(rain)
    ? rain
    : "—";

>>>>>>> Stashed changes
  setWeatherIcon(document.getElementById("weather-image"), data.weather[0]);

  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = data.weather[0].description;
}

function forecastRow(list, label, item) {
<<<<<<< Updated upstream
  const row = document.createElement("li");
  row.className = "forecast__item";
  const date = document.createElement("span");
  date.className = "forecast__day";
  date.textContent = label;
  const temperature = document.createElement("span");
  temperature.className = "forecast__temp";
  temperature.textContent = formatNumber(item.main.temp) + " °C";
  const icon = document.createElement("img");
  icon.className = "forecast__icon";
  icon.width = 40;
  icon.height = 40;
  setWeatherIcon(icon, item.weather?.[0]);
  row.append(date, temperature, icon);
=======
  const row = forecastTemplate.content.firstElementChild.cloneNode(true);

  row.querySelector(".forecast__day").textContent = label;
  row.querySelector(".forecast__value").textContent = Math.ceil(item.main.temp);

  setWeatherIcon(row.querySelector("img"), item.weather?.[0]);

>>>>>>> Stashed changes
  list.appendChild(row);
}

function showForecast(data) {
<<<<<<< Updated upstream
  if (!Array.isArray(data?.list)) throw new Error("Serveren returnerede ikke en gyldig vejrudsigt.");
  const entries = data.list.filter(item => Number.isFinite(item?.dt) && Number.isFinite(item?.main?.temp))
    .sort((a, b) => a.dt - b.dt);
  if (!entries.length) throw new Error("Vejrudsigten indeholder ingen brugbare målinger.");

  const days = new Map();
  // shortcut: the backend searches Denmark only; choose a timezone per city if that changes.
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("da-DK", { timeZone: "Europe/Copenhagen" });
=======
  if (!Array.isArray(data?.list)) {
    throw new Error("Serveren returnerede ikke en gyldig vejrudsigt.");
  }

  // Remove unusable readings and sort the rest from earliest to latest.
  const entries = data.list
    .filter(
      (item) => Number.isFinite(item?.dt) && Number.isFinite(item?.main?.temp),
    )
    .sort((a, b) => a.dt - b.dt);

  if (!entries.length) {
    throw new Error("Vejrudsigten indeholder ingen brugbare målinger.");
  }

  const days = new Map();

  // Store one forecast reading for each local date.
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];

    const date = new Date(item.dt * 1000);

    const day = date.toLocaleDateString("da-DK", {
      timeZone: "Europe/Copenhagen",
    });

    // Show the first eight three-hour readings, about one day.
>>>>>>> Stashed changes
    if (i < 8) {
      const label = date.toLocaleString("da-DK", {
        weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Copenhagen",
      });

      forecastRow(hourlyForecast, label, item);
    }
<<<<<<< Updated upstream
    // shortcut: daily summaries use the warmest returned slot; use daily data for full-day maxima.
    if (!days.has(day) || item.main.temp > days.get(day).main.temp) days.set(day, item);
  }
=======

    // Store the warmest returned reading for each date.
    if (!days.has(day) || item.main.temp > days.get(day).main.temp) {
      days.set(day, item);
    }
  }

  // Show one row for each of the first five dates.
>>>>>>> Stashed changes
  for (const item of [...days.values()].slice(0, 5)) {
    const label = new Date(item.dt * 1000).toLocaleDateString("da-DK", {
      weekday: "short", day: "numeric", month: "numeric", timeZone: "Europe/Copenhagen",
    });

    forecastRow(dailyForecast, label, item);
  }
<<<<<<< Updated upstream
=======

  // Warn when readings are invalid or fewer than five dates are available.
>>>>>>> Stashed changes
  if (entries.length !== data.list.length || days.size < 5) {
    forecastMessage.textContent = "Noget af vejrudsigten mangler.";
  }
}

async function fetchWeatherData(endpoint, city) {
  const response = await fetch(endpoint + "?city=" + encodeURIComponent(city));

  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Kunne ikke hente vejrdata. Prøv igen.");
  }

  return data;
}

async function getWeather() {
  const request = ++latestWeather;
<<<<<<< Updated upstream
  const city = document.getElementById("city-input").value.trim()
    || document.getElementById("city-name").textContent.trim();
  document.getElementById("city-name").textContent = city;
=======

  latestSuccessfulCity = "";
  saveLocationButton.disabled = true;

  // Use the search input, or keep the displayed city when the input is empty.
  const city =
    document.getElementById("city-input").value.trim() ||
    document.getElementById("city-name").textContent.trim();

  document.getElementById("city-name").textContent = city;

  // Clear old results while the requests run.
>>>>>>> Stashed changes
  weatherMessage.textContent = "Henter vejr for " + city + "...";
  forecastMessage.textContent = "Henter vejrudsigt...";

  for (const id of ["temperature", "condition", "feels-like", "wind", "rain"]) {
    document.getElementById(id).textContent = "—";
  }

  document.getElementById("weather-image").hidden = true;
<<<<<<< Updated upstream
  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = "";
  dailyForecast.replaceChildren();
  hourlyForecast.replaceChildren();
=======
>>>>>>> Stashed changes

  const [current, forecast] = await Promise.allSettled([
    fetchWeatherData("/api/weather", city),
    fetchWeatherData("/api/forecast", city),
  ]);
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
  if (request !== latestWeather) return;

  try {
    if (current.status === "rejected") {
      throw current.reason;
    }

    showCurrentWeather(current.value, city);

    latestSuccessfulCity = current.value.name || city;
    saveLocationButton.disabled = false;

    weatherMessage.textContent = "";
  } catch (error) {
    weatherMessage.textContent = error.message;
  }
<<<<<<< Updated upstream
=======

  // Display forecasts even if the current weather request failed.
>>>>>>> Stashed changes
  try {
    if (forecast.status === "rejected") {
      throw forecast.reason;
    }

    forecastMessage.textContent = "";
    showForecast(forecast.value);
  } catch (error) {
    dailyForecast.replaceChildren();
    hourlyForecast.replaceChildren();
    forecastMessage.textContent = error.message;
  }
}

<<<<<<< Updated upstream
document.querySelector(".js-search-form").addEventListener("submit", function (event) {
  event.preventDefault();
  return getWeather();
});

=======
// Save the selected city to the user's profile.
async function saveLocation() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    weatherMessage.textContent = "Log ind for at gemme din lokation.";
    return;
  }

  if (!latestSuccessfulCity) return;

  saveLocationButton.disabled = true;

  try {
    // Get the user's existing preferences.
    const getResponse = await fetch("/api/preferences", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!getResponse.ok) {
      throw new Error("Kunne ikke hente brugerens præferencer.");
    }

    const existingPreferences = await getResponse.json();

    // Add the preferred location without removing other preferences.
    const updatedPreferences = {
      ...existingPreferences,
      preferredLocation: latestSuccessfulCity,
    };

    // Save the updated preferences.
    const saveResponse = await fetch("/api/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedPreferences),
    });

    if (!saveResponse.ok) {
      throw new Error("Kunne ikke gemme lokationen.");
    }

    weatherMessage.textContent =
      latestSuccessfulCity + " er gemt som din foretrukne lokation.";
  } catch (error) {
    weatherMessage.textContent = error.message;
  } finally {
    saveLocationButton.disabled = false;
  }
}

// Submit a new city search without reloading the page.
document
  .querySelector(".js-search-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    return getWeather();
  });

// Connect the save location button.
saveLocationButton.addEventListener("click", saveLocation);

// Load weather when the page opens.
>>>>>>> Stashed changes
getWeather();
