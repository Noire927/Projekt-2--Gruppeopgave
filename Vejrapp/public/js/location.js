// Start when the user clicks "Find mig".
document.getElementById("locate-button").onclick = function () {
  // Ask the browser for the user's coordinates.
  navigator.geolocation.getCurrentPosition(async function (position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // shortcut: /api/location is a placeholder, implement it to return { city: "Odense" }.
    const response = await fetch("/api/location?lat=" + latitude + "&lon=" + longitude);
    const data = await response.json();

    // Put the returned city name into the search input.
    document.getElementById("city-input").value = data.city;

    // Submit the existing form to update weather, forecasts, and advice.
    document.querySelector(".js-search-form").requestSubmit();
  });
};
