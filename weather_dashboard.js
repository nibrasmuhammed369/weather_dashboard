const searchInput = document.getElementById("cityInput");
const forecastContainer = document.getElementById("forecastContainer");
const themeBtn = document.getElementById("themeBtn");
const error = document.getElementById("error");
const weatherResults = document.getElementById("weatherResults");
const favoritesList = document.getElementById("favoritesList");
const favoriteBtn = document.getElementById("favorite-btn")

let currentCity = "";


function updateClock() {
  const now = new Date();

  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  document.getElementById('time').textContent = timeString;
  document.getElementById('date').textContent = dateString;
}

updateClock();
setInterval(updateClock, 1000);
// REPLACE THIS with your OpenWeatherMap API key (FREE signup)



// 1. IMPLEMENT getWeather(city) - Fetch API + async/await

async function getWeather(city) {
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
  const [currentResponse,forecastResponse] = await Promise.all([
    fetch(currentUrl),
    fetch(forecastUrl)
  ]);

  if(!currentResponse.ok || !forecastResponse.ok){
    throw new Error("City not found or weather data unavailable")
  }

  const currentData = await currentResponse.json();
  const forecastData = await forecastResponse.json();
  console.log(currentData,forecastData);

  return {
    current:currentData,
    forecast:forecastData
  };
}

function displayCurrentWeather(data){
  let icon = data.weather[0].icon;
  const iconUrl =`https://openweathermap.org/img/wn/${icon}@2x.png`
  document.getElementById("temp").innerHTML = Math.round(data.main.temp) + "°C";
  document.getElementById("location").innerHTML = data.name;
  document.getElementById("condition").innerHTML = data.weather[0].description;
  document.getElementById("humidity").innerHTML = data.main.humidity;
  document.getElementById("wind").innerHTML = data.wind.speed;
  document.getElementById("weather-icon").src = iconUrl;

  currentCity = data.name;
}

function displayForecast(data) {

    forecastContainer.innerHTML = "";

    const dailyData = {};

    data.list.forEach(item => {

        const date = item.dt_txt.split(" ")[0];

        if (!dailyData[date]) {
            dailyData[date] = item;
        } else {
            // Choose the forecast closest to 12:00 noon
            const currentHour = Number(
                dailyData[date].dt_txt.split(" ")[1].slice(0, 2)
            );

            const newHour = Number(
                item.dt_txt.split(" ")[1].slice(0, 2)
            );

            if (Math.abs(newHour - 12) < Math.abs(currentHour - 12)) {
                dailyData[date] = item;
            }
        }

    });

    Object.values(dailyData).slice(0, 5).forEach(day => {

        const card = document.createElement("div");
        card.className = "forecast-card";

        // Format date to show short day (e.g., Wed, Thu)
        const dateObj = new Date(day.dt_txt.split(" ")[0]);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        card.innerHTML = `
            <h3>${dayName}</h3>
            <h2>${Math.round(day.main.temp)}°C</h2>
            <p>${day.weather[0].description}</p>
        `;

        forecastContainer.appendChild(card);
    });
}


async function searchWeather(city = searchInput.value.trim()){
  if(!city){
    error.textContent = "please enter a city name";
    weatherResults.classList.add("hidden");
    return;
  }

  error.textContent = "";
  

  try{
    const weatherData = await getWeather(city);

    displayCurrentWeather(weatherData.current);
    displayForecast(weatherData.forecast);

    weatherResults.classList.remove("hidden");
  }
  catch(err){
    error.textContent = err.message;
    weatherResults.classList.add("hidden");
  }
}

document.getElementById("searchBtn").addEventListener("click",() => {
  searchWeather()
});


function loadTheme() {

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        themeBtn.textContent = "🌙 Dark";
    } else {
        document.body.classList.remove("light-mode");
        themeBtn.textContent = "☀️ Light";
    }

}


function toggleTheme() {

    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {

        localStorage.setItem("theme", "light");
        themeBtn.textContent = "🌙 Dark";

    } else {

        localStorage.setItem("theme", "dark");
        themeBtn.textContent = "☀️ Light";

    }

}

async function addFavorite(city){
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.includes(city)){
    return;
  }

  favorites.push(city);

  localStorage.setItem("favorites",JSON.stringify(favorites));

  loadFavorites();
}


function removeFavorite(city) {

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    favorites = favorites.filter(item => item !== city);

    localStorage.setItem("favorites", JSON.stringify(favorites));

    loadFavorites();
}

function loadFavorites() {

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    favoritesList.innerHTML = "";

    favorites.forEach(city => {

        const button = document.createElement("button");

        button.textContent = city;
        button.classList.add("favorite-city-btn");

        button.addEventListener("click", () => {
            searchWeather(city);
        });

        const removeBtn = document.createElement("button");

        removeBtn.textContent = "❌";
        removeBtn.classList.add("remove-favorite-btn");

        removeBtn.addEventListener("click", () => {
            removeFavorite(city);
        });

        favoritesList.appendChild(button);
        favoritesList.appendChild(removeBtn);

    });
}

// 7. DEBOUNCE SEARCH
function debounceSearch() {

    let timer;

    return function(city) {

        clearTimeout(timer);

        timer = setTimeout(() => {
            searchWeather(city);
        }, 500);

    };
}

const debouncedSearch = debounceSearch();

// Enter key
    searchInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            searchWeather();
        }

    });

    // Debounced input search
    searchInput.addEventListener("input", event => {

        const city = event.target.value.trim();

        if (city.length >= 2) {
            error.textContent = "";
            debouncedSearch(city);
        }

    });

favoriteBtn.addEventListener("click", () => {
    addFavorite(currentCity);
});

document.addEventListener("DOMContentLoaded", function () {
  // TODO: Add your event listeners here

  loadFavorites();
  loadTheme();
});
themeBtn.addEventListener("click", toggleTheme);