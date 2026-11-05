const weatherMessage = document.getElementById("weather-message");
const forecastMessage = document.getElementById("forecast-message");
const dailyForecast = document.getElementById("forecast-daily");
const hourlyForecast = document.getElementById("forecast-hourly");
const forecastTemplate = document.getElementById("forecast-row");
let latestWeather = 0;

function setWeatherIcon(image, condition) {
  image.alt = condition?.description || "Vejret er ikke oplyst";
  image.hidden = !/^(01|02|03|04|09|10|11|13|50)[dn]$/.test(condition?.icon);
  if (!image.hidden) {
    image.src = "https://openweathermap.org/img/wn/" + condition.icon + "@2x.png";
  }
  image.onerror = function () { image.hidden = true; };
}

function showCurrentWeather(data, city) {
  if (
    !Number.isFinite(data?.main?.temp) ||
    typeof data?.weather?.[0]?.description !== "string"
  ) {
    throw new Error("Serveren returnerede ikke gyldige vejrdata.");
  }

  document.getElementById("city-name").textContent =
    typeof data.name === "string" ? data.name : city;
  document.getElementById("temperature").textContent = data.main.temp;
  document.getElementById("condition").textContent =
    data.weather[0].description;
  document.getElementById("feels-like").textContent = Number.isFinite(data.main.feels_like)
    ? data.main.feels_like : "—";
  const wind = data.wind?.speed;
  document.getElementById("wind").textContent = Number.isFinite(wind) ? wind : "—";
  const rain = data.rain?.["1h"] ?? 0;
  document.getElementById("rain").textContent = Number.isFinite(rain) ? rain : "—";
  setWeatherIcon(document.getElementById("weather-image"), data.weather[0]);

  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = data.weather[0].description;
}

function forecastRow(list, label, item) {
  const row = forecastTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".forecast__day").textContent = label;
  row.querySelector(".forecast__value").textContent = item.main.temp;
  setWeatherIcon(row.querySelector("img"), item.weather?.[0]);
  list.appendChild(row);
}

function showForecast(data) {
  if (!Array.isArray(data?.list))
    throw new Error("Serveren returnerede ikke en gyldig vejrudsigt.");
  const entries = data.list
    .filter(
      (item) => Number.isFinite(item?.dt) && Number.isFinite(item?.main?.temp),
    )
    .sort((a, b) => a.dt - b.dt);
  if (!entries.length)
    throw new Error("Vejrudsigten indeholder ingen brugbare målinger.");

  const days = new Map();
  // shortcut: the backend searches Denmark only; choose a timezone per city if that changes.
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString("da-DK", {
      timeZone: "Europe/Copenhagen",
    });
    if (i < 8) {
      const label = date.toLocaleString("da-DK", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Copenhagen",
      });
      forecastRow(hourlyForecast, label, item);
    }
    // shortcut: daily summaries use the warmest returned slot; use daily data for full-day maxima.
    if (!days.has(day) || item.main.temp > days.get(day).main.temp)
      days.set(day, item);
  }
  for (const item of [...days.values()].slice(0, 5)) {
    const label = new Date(item.dt * 1000).toLocaleDateString("da-DK", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
      timeZone: "Europe/Copenhagen",
    });
    forecastRow(dailyForecast, label, item);
  }
  if (entries.length !== data.list.length || days.size < 5) {
    forecastMessage.textContent = "Noget af vejrudsigten mangler.";
  }
}

async function fetchWeatherData(endpoint, city) {
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

async function getWeather() {
  const request = ++latestWeather;
  const city =
    document.getElementById("city-input").value.trim() ||
    document.getElementById("city-name").textContent.trim();
  document.getElementById("city-name").textContent = city;
  weatherMessage.textContent = "Henter vejr for " + city + "...";
  forecastMessage.textContent = "Henter vejrudsigt...";
  for (const id of ["temperature", "condition", "feels-like", "wind", "rain"]) {
    document.getElementById(id).textContent = "—";
  }
  document.getElementById("weather-image").hidden = true;
  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = "";
  dailyForecast.replaceChildren();
  hourlyForecast.replaceChildren();

  const [current, forecast] = await Promise.allSettled([
    fetchWeatherData("/api/weather", city),
    fetchWeatherData("/api/forecast", city),
  ]);
  if (request !== latestWeather) return;

  try {
    if (current.status === "rejected") throw current.reason;
    showCurrentWeather(current.value, city);
    weatherMessage.textContent = "";
  } catch (error) {
    weatherMessage.textContent = error.message;
  }
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

document
  .querySelector(".js-search-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    return getWeather();
  });

getWeather();
