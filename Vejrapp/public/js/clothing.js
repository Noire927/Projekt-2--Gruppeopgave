// Clothing names and weather-based recommendations.
/*
 * Each key is a stable clothing ID; each value is the English text shown to the person.
 * cards reuses these keys for the preference game, so its choices match the advice rules.
 * Choice: saving IDs instead of display sentences lets wording change without losing likes.
 */
const clothes = {
    winterJacket: "a warm winter jacket", jacket: "a jacket", sweater: "a sweater",
    tshirt: "a T-shirt", longPants: "long trousers", shorts: "shorts",
    umbrella: "an umbrella", raincoat: "a raincoat", windbreaker: "a windproof jacket"
};
const cards = Object.keys(clothes);

/*
 * Input: a non-empty array of known clothing IDs, e.g. ["jacket", "sweater"].
 * Also reads the applied preferences.likedClothes and preferences.dislikedClothes arrays.
 * How: choose the first liked option; otherwise the first option that is not disliked.
 * If every option is disliked, use the first one so a required clothing layer is retained.
 * Output: return that item's display string, e.g. "a sweater". No DOM or storage changes.
 * Choice: simple priority loops make these small rules easier to follow than a scoring system.
 */
function chooseClothing(options) {
    let likes = preferences.likedClothes || [];
    let dislikes = preferences.dislikedClothes || [];
    for (let item of options) if (likes.includes(item)) return clothes[item];
    for (let item of options) if (!dislikes.includes(item)) return clothes[item];
    return clothes[options[0]]; // Dislikes must not remove a layer needed for the weather.
}

/*
 * Input: the current-weather object: temperature_2m in Celsius, precipitation in mm,
 * and wind_speed_10m in km/h. Also reads the applied clothing preferences.
 * How: adjust a local copy of temperature by -3 for someone who feels cold or +3 for warm;
 * then choose an outfit using the 5, 15 and 23 degree boundaries and chooseClothing.
 * Children also get fixed hat/glove advice in the coldest band, regardless of likes/dislikes.
 * Precipitation above 0 mm and wind above 30 km/h add extra advice.
 * Output: return undefined; write sentences into elements.clothingAdvice and clothingExtras.
 * The actual weather temperature and the original weather object are not changed.
 * Choice: fixed project rules make personalization explainable without extra data or libraries.
 */
function showClothing(weather) {
    let temperature = weather.temperature_2m;
    if (preferences.temperaturePreference === "cold") temperature -= 3;
    if (preferences.temperaturePreference === "warm") temperature += 3;
    let outfit;
    if (temperature < 5) {
        outfit = [chooseClothing(["winterJacket"]), chooseClothing(["longPants"])];
        if (preferences.ageGroup === "child") outfit.push("a hat", "gloves");
    } else if (temperature < 15) outfit = [chooseClothing(["jacket", "sweater"]), chooseClothing(["longPants"])];
    else if (temperature < 23) outfit = [chooseClothing(["tshirt"]), chooseClothing(["longPants"])];
    else outfit = [chooseClothing(["tshirt"]), chooseClothing(["shorts"])];
    let last = outfit.pop();
    elements.clothingAdvice.textContent = "Wear " + outfit.join(", ") + " and " + last + ".";
    let extras = [];
    if (weather.precipitation > 0) extras.push("Bring " + chooseClothing(["umbrella", "raincoat"]) + ".");
    if (weather.wind_speed_10m > 30) extras.push("Consider " + chooseClothing(["windbreaker"]) + ".");
    elements.clothingExtras.textContent = extras.join(" ");
}
