// Find the message elements, forecast lists, and HTML row template.
const weatherMessage = document.getElementById("weather-message");
const forecastMessage = document.getElementById("forecast-message");
const dailyForecast = document.getElementById("forecast-daily");
const hourlyForecast = document.getElementById("forecast-hourly");
const forecastTemplate = document.getElementById("forecast-row");
let latestWeather = 0; // Count searches so older responses cannot replace newer results.

// Set the weather image and its alternative text.
function setWeatherIcon(image, condition) {
  image.alt = condition?.description || "Vejret er ikke oplyst";
  // Accept only known day (d) and night (n) icon codes.
  image.hidden = !/^(01|02|03|04|09|10|11|13|50)[dn]$/.test(condition?.icon);
  if (!image.hidden) {
    image.src =
      "https://openweathermap.org/img/wn/" + condition.icon + "@2x.png";
  }
  image.onerror = function () {
    // Hide the image if the icon request fails.
    image.hidden = true;
  };
}

// Put the current weather values into the HTML.
function showCurrentWeather(data, city) {
  // Reject responses without a valid temperature or condition description.
  if (
    !Number.isFinite(data?.main?.temp) ||
    typeof data?.weather?.[0]?.description !== "string"
  ) {
    throw new Error("Serveren returnerede ikke gyldige vejrdata.");
  }

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
  const rain = data.rain?.["1h"] ?? 0; // Use zero when the response has no rainfall value.
  document.getElementById("rain").textContent = Number.isFinite(rain)
    ? rain
    : "—";
  setWeatherIcon(document.getElementById("weather-image"), data.weather[0]);
}

// Copy the HTML template, fill its values, and add it to the forecast list.
function forecastRow(list, label, item) {
  const row = forecastTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".forecast__day").textContent = label;
  row.querySelector(".forecast__value").textContent = Math.ceil(item.main.temp);
  setWeatherIcon(row.querySelector("img"), item.weather?.[0]);
  list.appendChild(row);
}

// Build the short-term and daily forecast lists.
function showForecast(data) {
  if (!Array.isArray(data?.list))
    throw new Error("Serveren returnerede ikke en gyldig vejrudsigt.");
  // Remove unusable readings and sort the rest from earliest to latest.
  const entries = data.list
    .filter(
      (item) => Number.isFinite(item?.dt) && Number.isFinite(item?.main?.temp),
    )
    .sort((a, b) => a.dt - b.dt);
  if (!entries.length)
    throw new Error("Vejrudsigten indeholder ingen brugbare målinger.");

  const days = new Map(); // Store one forecast reading for each local date.
  // shortcut: Denmark only, use each city's timezone if the backend supports other countries.
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    const date = new Date(item.dt * 1000); // Convert Unix seconds to JavaScript milliseconds.
    const day = date.toLocaleDateString("da-DK", {
      timeZone: "Europe/Copenhagen",
    });
    // Show the first eight three-hour readings, about one day.
    if (i < 8) {
      const label = date.toLocaleString("da-DK", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Copenhagen",
      });
      forecastRow(hourlyForecast, label, item);
    }
    // shortcut: daily rows use the warmest returned reading, use daily data for complete daily maximum temperatures.
    if (!days.has(day) || item.main.temp > days.get(day).main.temp)
      days.set(day, item);
  }
  // Show one row for each of the first five dates.
  for (const item of [...days.values()].slice(0, 5)) {
    const label = new Date(item.dt * 1000).toLocaleDateString("da-DK", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
      timeZone: "Europe/Copenhagen",
    });
    forecastRow(dailyForecast, label, item);
  }
  // Warn when readings are invalid or fewer than five dates are available.
  if (entries.length !== data.list.length || days.size < 5) {
    forecastMessage.textContent = "Noget af vejrudsigten mangler.";
  }
}

// Request JSON from the backend and report unsuccessful responses.
async function fetchWeatherData(endpoint, city) {
  // Encode the city so spaces and special characters stay inside the query value.
  const response = await fetch(endpoint + "?city=" + encodeURIComponent(city));
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Kunne ikke hente vejrdata. Prøv igen.",
    );
  }
  return data;
}

// Load fresh weather and forecasts for the selected city.
async function getWeather() {
  const request = ++latestWeather;
  // Use the search input, or keep the displayed city when the input is empty.
  const city =
    document.getElementById("city-input").value.trim() ||
    document.getElementById("city-name").textContent.trim();
  document.getElementById("city-name").textContent = city;
  // Clear old results while the requests run.
  weatherMessage.textContent = "Henter vejr for " + city + "...";
  forecastMessage.textContent = "Henter vejrudsigt...";
  for (const id of ["temperature", "condition", "feels-like", "wind", "rain"]) {
    document.getElementById(id).textContent = "—";
  }
  document.getElementById("weather-image").hidden = true;
  // const greeting = document.getElementById("greeting");
  // if (greeting) greeting.textContent = "";
  // dailyForecast.replaceChildren();
  // hourlyForecast.replaceChildren();

  // Send both requests together and keep each success or failure separately.
  const [current, forecast] = await Promise.allSettled([
    fetchWeatherData("/api/weather", city),
    fetchWeatherData("/api/forecast", city),
  ]);
  if (request !== latestWeather) return; // Ignore results from an older search.

  // Display current weather even if the forecast request failed.
  try {
    if (current.status === "rejected") throw current.reason;
    showCurrentWeather(current.value, city);
    weatherMessage.textContent = "";
  } catch (error) {
    weatherMessage.textContent = error.message;
  }
  // Display forecasts even if the current weather request failed.
  try {
    if (forecast.status === "rejected") throw forecast.reason;
    forecastMessage.textContent = "";
    showForecast(forecast.value);
  } catch (error) {
    dailyForecast.replaceChildren();
    hourlyForecast.replaceChildren();
    forecastMessage.textContent = error.message;
  }
}

// Submit a new city search without reloading the page.
document
  .querySelector(".js-search-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    return getWeather();
  });

// Load weather when the page opens.
getWeather();
