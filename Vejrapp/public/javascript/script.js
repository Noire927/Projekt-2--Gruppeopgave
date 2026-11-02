const WEATHER_API_KEY = "fe14993734ac9771155dae2b820509b1"; 
const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;



//sad bare og kiggede lidt på det, i er velkomne til at slette det hvis det er. det er ikke særlig sammenhængende endnu. ren kaos y'all
async function vejrDataInput(by) {
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error("dude, vi mangler data..");
    } 
    return await response.json();
}
function vejrInfo (data) {

}