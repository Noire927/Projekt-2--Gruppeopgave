// Current conditions and the daily/hourly forecasts.

/*
 * Each weather fetch increments this counter. A response may update the page only when
 * its captured request number still matches. Older requests run, but their results are ignored.
 */
let latestWeather = 0;

// Each weather type has a small local SVG, so no icon library is needed.
/*
 * Input: Open-Meteo's numeric weather code and isDay (0 for night, 1 for day; may be absent).
 * How: group related weather codes into a label and a local icon name; clear nights use moon.
 * Output: return { text, icon }, e.g. { text: "Rain", icon: "rain" }; no DOM changes.
 * Unknown codes return an unavailable label and a cloud icon rather than claiming a condition.
 * Choice: one local mapping serves current/hourly/daily weather without an icon service.
 */
function weatherDescription(code, isDay) {
    if (code === 0 || code === 1) return isDay === 0 ? { text: "Clear", icon: "moon" } : { text: "Sunny", icon: "sun" };
    if (code === 2) return { text: "Partly cloudy", icon: "partly-cloudy" };
    if (code === 3) return { text: "Cloudy", icon: "cloud" };
    if ([45, 48].includes(code)) return { text: "Foggy", icon: "fog" };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: "Rain", icon: "rain" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snow", icon: "snow" };
    if ([95, 96, 97, 99].includes(code)) return { text: "Thunderstorm", icon: "storm" };
    return { text: "Weather condition unavailable", icon: "cloud" };
}

/*
 * Input: a weather number, or a missing/non-numeric value.
 * How: use English number formatting with at most one decimal place.
 * Output: return a display string, or an em dash when no finite number is available.
 * Choice: one formatter keeps temperature, rain and wind output consistent; callers add units.
 */
function formatNumber(value) {
    return Number.isFinite(value) ? value.toLocaleString("en-GB", { maximumFractionDigits: 1 }) : "—";
}

// Weather wind direction means where the wind comes FROM.
/*
 * Input: the API's wind bearing in degrees (0-360), or a missing value.
 * How: divide the circle into eight 45-degree sectors and round to the nearest compass word;
 * the modulo wraps 360 degrees back to north.
 * Output: return the direction word, or "an unknown direction" for a non-finite value.
 * Choice: compass words explain where wind comes from more clearly than a raw degree value.
 */
function windDirection(degrees) {
    let directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
    return Number.isFinite(degrees) ? directions[Math.round(degrees / 45) % 8] : "an unknown direction";
}

/*
 * Input: no declared arguments; use selectedCity's name, latitude and longitude.
 * How: mark a new request, hide the old panel, show a loading message, and fetch Open-Meteo.
 * One request asks for current conditions, hourly data and seven daily maxima;
 * the URL fixes wind units to km/h and requests the selected location's local timestamps.
 * Check response.ok, parse JSON, ignore stale requests, then require a finite temperature.
 * Cache the current-weather object, fill weather elements, and call showClothing/showForecast.
 * Output: return a Promise that resolves to undefined, not the weather data. Results appear
 * in elements.weatherPanel, the clothing advice and forecast lists. On failure, the latest
 * request shows an error in elements.weatherMessage and reveals retryWeatherButton.
 * A failed fetch leaves the panel hidden and retains the last successful currentWeather.
 * Choice: native fetch needs no SDK; a request counter prevents an older city's response
 * from replacing a newer city without introducing cancellation logic.
 */
async function getWeather() {
    let request = ++latestWeather;
    let city = selectedCity;
    elements.weatherPanel.hidden = true;
    elements.retryWeatherButton.hidden = true;
    elements.weatherMessage.textContent = "Loading weather for " + city.name + "…";
    let url = "https://api.open-meteo.com/v1/forecast?latitude=" + city.lat + "&longitude=" + city.lon;
    url += "&current=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code,is_day";
    url += "&hourly=temperature_2m,weather_code,is_day";
    url += "&daily=temperature_2m_max,weather_code&forecast_days=7&timezone=auto&wind_speed_unit=kmh";
    try {
        let response = await fetch(url);
        if (!response.ok) throw new Error("Weather request failed");
        let data = await response.json();
        if (request !== latestWeather) return; // A slower, older city request must not replace the latest one.
        let weather = data.current;
        if (!weather || !Number.isFinite(weather.temperature_2m)) throw new Error("Missing weather");
        currentWeather = weather;
        let condition = weatherDescription(weather.weather_code, weather.is_day);
        elements.cityName.textContent = city.name;
        elements.temperature.textContent = formatNumber(weather.temperature_2m) + " °C";
        elements.conditions.textContent = condition.text;
        elements.weatherIcon.src = "icons/" + condition.icon + ".svg";
        elements.wind.textContent = weather.wind_speed_10m === 0 ? "Calm" : "Wind from " + windDirection(weather.wind_direction_10m);
        elements.windSpeed.textContent = formatNumber(weather.wind_speed_10m) + " km/h";
        elements.rain.textContent = weather.precipitation === 0 ? "No precipitation"
            : Number.isFinite(weather.precipitation) ? formatNumber(weather.precipitation) + " mm precipitation" : "Precipitation unavailable";
        showClothing(weather);
        showForecast(data);
        elements.weatherPanel.hidden = false;
        elements.weatherMessage.textContent = "";
    } catch {
        if (request !== latestWeather) return;
        elements.weatherMessage.textContent = "Could not load weather. Try again or choose another city.";
        elements.retryWeatherButton.hidden = false;
    }
}

// API values go into textContent, never into HTML.
/*
 * Input: the destination list node, its date/time label, Celsius temperature, weather code
 * and optional day/night flag.
 * How: create one li with label text, a formatted temperature and a local weather icon.
 * Output: return undefined; append that row to the supplied list. The icon's alt text
 * contains the weather description, so its meaning is also available without the picture.
 * Choice: textContent keeps text out of HTML parsing, and both forecast views reuse this row.
 */
function forecastRow(list, label, temperature, code, isDay) {
    let row = document.createElement("li");
    let date = document.createElement("span");
    date.textContent = label;
    let value = document.createElement("strong");
    value.textContent = formatNumber(temperature) + " °C";
    let icon = document.createElement("img");
    let condition = weatherDescription(code, isDay);
    icon.src = "icons/" + condition.icon + ".svg";
    icon.alt = condition.text;
    icon.width = 40;
    icon.height = 40;
    row.append(date, " — ", value, " ", icon);
    list.appendChild(row);
}

/*
 * Input: the forecast response, with current.time and optional hourly/daily arrays.
 * How: clear both lists; use the date in current.time to select every hour of that local day
 * (including earlier hours), then render up to seven daily maximum temperatures.
 * Rows with missing temperatures are skipped; each row is built with forecastRow.
 * Daily date-only strings are formatted in UTC so the browser's own timezone does not
 * shift their calendar date. Daily condition icons use a daytime flag.
 * Output: return undefined; replace elements.hourlyList/dailyList contents and set
 * elements.forecastMessage if the hourly list is empty or fewer than seven days were rendered.
 * Choice: selecting the API's local date and slicing its hour strings preserves the chosen
 * city's displayed times without converting them through the viewer's timezone.
 */
function showForecast(data) {
    let hours = elements.hourlyList;
    let days = elements.dailyList;
    hours.replaceChildren();
    days.replaceChildren();
    let today = (data.current.time || "").slice(0, 10);
    let hourly = data.hourly;
    if (hourly && hourly.time) {
        for (let i = 0; i < hourly.time.length; i++) {
            let time = hourly.time[i];
            if (!today || typeof time !== "string" || !time.startsWith(today) || !Number.isFinite(hourly.temperature_2m?.[i])) continue;
            forecastRow(hours, time.slice(11, 16), hourly.temperature_2m[i], hourly.weather_code?.[i], hourly.is_day?.[i]);
        }
    }
    let daily = data.daily;
    if (daily && daily.time) {
        for (let i = 0; i < daily.time.length && i < 7; i++) {
            if (!Number.isFinite(daily.temperature_2m_max?.[i])) continue;
            let date = new Date(daily.time[i] + "T12:00:00Z");
            let label = date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "numeric", timeZone: "UTC" });
            forecastRow(days, label, daily.temperature_2m_max[i], daily.weather_code?.[i], 1);
        }
    }
    elements.forecastMessage.textContent = days.children.length === 7 && hours.children.length
        ? "" : "Some forecast information is unavailable. Try loading the weather again.";
}
