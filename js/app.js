"use strict"

/**********************   MAIN   ***************************/

// El Paso Coordinates
const DEFAULT_LONGITUDE = -106.44915607264488;
const DEFAULT_LATITUDE = 31.770367133639994;
let currentMarker = [];   // holds current marker. only contains one marker at a time

// Default Weather View (El Paso)
getCurrentWeather(DEFAULT_LONGITUDE, DEFAULT_LATITUDE);
getForecast(DEFAULT_LONGITUDE, DEFAULT_LATITUDE);
let map = initializeMap(MAPBOX_KEY, DEFAULT_LONGITUDE, DEFAULT_LATITUDE);
let geocoder = initializeGeocoder(map);
updateMarker(DEFAULT_LONGITUDE,DEFAULT_LATITUDE); // default marker

/***********************  EVENTS  *************************/

// After pressing enter on geocoder search
// center map and create marker on result coordinates
geocoder.on("result", function(event) {
    let newCoordinates = event.result.geometry.coordinates;
    updateMarker(newCoordinates[0], newCoordinates[1]);
    getCurrentWeather(newCoordinates[0], newCoordinates[1]);
    getForecast(newCoordinates[0], newCoordinates[1]);
    centerMapOnMarker();
    map.setZoom(10);
});

// on click, adds marker on map
// updates weather based on new marker
map.on("click", function(e) {
    let coordinates = e.lngLat;
    updateMarker(coordinates.lng, coordinates.lat);
    getCurrentWeather(coordinates.lng, coordinates.lat);
    getForecast(coordinates.lng, coordinates.lat);
});

// Center map on current marker when current location text is clicked
$("#current-city").click(function(){
    centerMapOnMarker();
});

/***************   WEATHER FUNCTIONS  *******************/

// Get current weather in passed in coordinates
// Populate current weather card with data received
function getCurrentWeather(inputLong, inputLat) {
    $.get("http://api.openweathermap.org/data/2.5/weather", {
        APPID: WEATHER_KEY,
        lon: inputLong,
        lat: inputLat,
        units: "imperial"
    }).done((result) => populateCurrentWeather(result))
        .fail( () => { console.log("Failed to retrieve data") });
}

// Populate current weather card with data received
function populateCurrentWeather(result){
    $("#current-city").text(result.name);  // Update current city display

    // Current Weather Card Header
    $("#current-date").text(formatUnixDate(result.dt));
    $("#current-weekday").text("Today");
    $("#current-time").text(formatUnixTime(result.dt));

    // Current Weather Card Body
    $("#city-name").text(result.name);
    $("#weather-desc").text(result.weather[0].main);
    $("#current-temp").text(result.main.temp.toFixed(0) + " \u2109");
    renderWeatherBackgroundImage(result.weather[0].main);  // Render card body bg image

    // Current Weather Card List
    $("#current-weather-details li:nth-child(1)").text("Description: " + capitalizeFirstLetter(result.weather[0].description));
    $("#current-weather-details li:nth-child(2)").text("Feels like: " + result.main.feels_like + " \u2109");
    $("#current-weather-details li:nth-child(3)").text("Humidity: " + result.main.humidity + "%");
    $("#current-weather-details li:nth-child(4)").text("Wind Speed: " + result.wind.speed + " mph");
    $("#current-weather-details li:nth-child(5)").text("Pressure: " + result.main.pressure);
}

// Get 5-day weather forecast of passed in coordinates
function getForecast(inputLong, inputLat){
    $.get("http://api.openweathermap.org/data/2.5/onecall", {
        APPID: WEATHER_KEY,
        lon: inputLong,
        lat: inputLat,
        units: "imperial"
    }).done((result) => populateForecast(result))
        .fail( () => { console.log("Failed to retrieve data") });
}

// Populate forecast cards with passed in coordinates
function populateForecast(result){
    console.log(result);
    let forecastObj = result.daily;
    for(let i = 1; i < 6; i++){
        // Forecast Card Header
        $(`#forecast-date-${i}`).text(formatUnixDate(forecastObj[i].dt));
        $(`#forecast-weekday-${i}`).text(WEEKDAYS[getDayFromUnixTime(forecastObj[i].dt)]);

        // Forecast Card Body
        $(`#forecast-high-${i}`).text("H: " + forecastObj[i].temp.max + "\u2109");
        $(`#forecast-low-${i}`).text("L: " + forecastObj[i].temp.min + "\u2109");
        let icon = forecastObj[i].weather[0].icon;
        $(`#forecast-icon-${i}`).attr("src",`http://openweathermap.org/img/w/${icon}.png`);

        // Forecast Card List
        $(`#forecast-details-${i} li:nth-child(1)`).text("Description: " + capitalizeFirstLetter(forecastObj[i].weather[0].description));
        $(`#forecast-details-${i} li:nth-child(2)`).text("Humidity: " + forecastObj[i].humidity + "%");
        $(`#forecast-details-${i} li:nth-child(3)`).text("Wind Speed: " + forecastObj[i].wind_speed + " mph");
        $(`#forecast-details-${i} li:nth-child(4)`).text("Pressure: " + forecastObj[i].pressure);
    }
}

// Adds appropriate bg image based on weather description
function renderWeatherBackgroundImage(weather){
    let cardBodyBg = $("#current-weather .card-body");
    switch(weather){
        case "Clouds":
            cardBodyBg.css({"background-image": "url(assets/clouds.jpg)", "color": "black"});
            break;
        case "Clear":
            cardBodyBg.css({"background-image": "url(assets/clear.jpg)", "color": "white"});
            break;
        case "Snow":
            cardBodyBg.css({"background-image": "url(assets/snow.jpg)", "color": "white"});
            break;
        case "Drizzle":
            cardBodyBg.css({"background-image": "url(assets/drizzle.jpg)", "color": "white"});
            break;
        case "Rain":
            cardBodyBg.css({"background-image": "url(assets/rain.jpg)", "color": "white"});
            break;
        case "Thunderstorm":
            cardBodyBg.css({"background-image": "url(assets/thunderstorm.jpg)", "color": "black"});
            break;
        case "Mist":
        case "Smoke":
        case "Haze":
        case "Dust":
        case "Fog":
        case "Sand":
        case "Ash":
            cardBodyBg.css({"background-image": "url(assets/mist.jpg)", "color": "black"});
            break;
        default:
            cardBodyBg.css("background-image", "");
            break;
    }
}

/*****************  MAPBOX FUNCTIONS  **********************/

// Initialize mapbox map
function initializeMap(key, long, lat){
    mapboxgl.accessToken = key;
    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        zoom: 10,
        center: [long, lat]
    });

    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    return map;
}

// Initialize mapbox geocoder
function initializeGeocoder(map){
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        flyTo: false
    });

    $("#geocoder").append(geocoder.onAdd(map));
    return geocoder;
}

// updates location of marker
function updateMarker(long, lat){
    if(currentMarker.length > 0){
        let removeMarker = currentMarker.pop();
        removeMarker.remove();
    }
    let newMarker = new mapboxgl.Marker({"color":"red"})
        .setLngLat([long, lat])
        .addTo(map);

    // assign as current marker
    currentMarker.push(newMarker);
}

// centers map on marker
function centerMapOnMarker(){
    let coordinates = currentMarker[0]._lngLat;
    map.setCenter([coordinates.lng,coordinates.lat]);
}

/********************  UTILITIES  *****************************/

const UNIX_TIMESTAMP_24_HOURS = 86400;  // 24 hours in unix time stamp
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// Return unix time stamp in regular time format
function formatUnixTime(unixTime) {
    let date = new Date(unixTime * 1000);
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();

    // Will display time in HH:MM:SS format
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

// Return unix time stamp in regular date format
function formatUnixDate(unixTime) {
    let date = new Date(unixTime * 1000);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    // Will display date in YY-MM-DD
    return year + "-" + month + "-" + day;
}

// Get weekday (saturday/monday etc..) from unix time stamp
function getDayFromUnixTime(unixTime) {
    let date = new Date(unixTime * 1000);
    return date.getDay();
}

// Capitalize every first letter in each word
function capitalizeFirstLetter(str){
    let strArr = str.split(" ");
    for(let i = 0; i < strArr.length; i++){
        strArr[i] = strArr[i][0].toUpperCase() + strArr[i].substring(1);
    }
    return strArr.join(" ")
}