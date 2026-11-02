// ===== 0. SETTINGS =====
// destinations.json holds all 10 destinations. Only entries with "visible": true
// are shown on the website. Set this to true to show all 10.
const SHOW_ALL_DESTINATIONS = false;

// Small safe wrappers: localStorage can be blocked (private mode) or hold bad data
function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(error);
  }
}

// ===== 1. MOBILE MENU (Week 02) =====
// Show or hide the navigation when the button is clicked
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', function () {
    nav.classList.toggle('open'); // adds 'open' if missing, removes it if present
    const isOpen = nav.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', isOpen); // tells screen readers the menu state
  });
}

// ===== 1b. DARK MODE (Week 05) =====
const THEME_KEY = 'lankaExplorerTheme';
const themeToggle = document.querySelector('.theme-toggle');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = 'Light mode';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = 'Dark mode';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', function () {
    const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    storageSet(THEME_KEY, newTheme);
    applyTheme(newTheme);
  });

  // Saved choice first; otherwise follow the operating system setting
  const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(storageGet(THEME_KEY) || (osPrefersDark ? 'dark' : 'light'));
}

// ===== 2. LOAD DATA (Week 03) =====
// Returns the destinations that are shown on the site.
// Pass true to get every entry in the JSON file (all 10).
async function loadDestinations(includeHidden = false) {
  const response = await fetch('data/destinations.json');
  if (!response.ok) {
    throw new Error('Could not load destinations (status ' + response.status + ')');
  }
  const destinations = await response.json();
  if (includeHidden || SHOW_ALL_DESTINATIONS) {
    return destinations;
  }
  return destinations.filter(place => place.visible !== false);
}

// ===== 3. HELPER FUNCTIONS =====
// 0 becomes "Free", 36 becomes "USD 36"
function formatFee(fee) {
  if (fee === 0) {
    return 'Free';
  } else {
    return 'USD ' + fee;
  }
}

// Groups places into price bands (if / else if / else)
function getPriceLabel(fee) {
  if (fee === 0) {
    return 'Free';
  } else if (fee <= 15) {
    return 'Budget';
  } else if (fee <= 30) {
    return 'Mid-range';
  } else {
    return 'Premium';
  }
}

// Free places show only "Free"; paid places show e.g. "USD 36 · Premium"
function describeFee(fee) {
  if (fee === 0) {
    return 'Free';
  }
  return `${formatFee(fee)} · ${getPriceLabel(fee)}`;
}

// Picks a CSS class for each category badge (switch)
function getCategoryClass(category) {
  switch (category) {
    case 'Heritage':
      return 'badge-heritage';
    case 'Beach':
      return 'badge-beach';
    case 'Nature':
      return 'badge-nature';
    case 'Wildlife':
      return 'badge-wildlife';
    default:
      return 'badge-other';
  }
}

// Builds one <article class="card"> from one destination object
function createCard(place) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <img src="${place.image}" alt="${place.name}" loading="lazy">
    <h3>${place.name}</h3>
    <p class="meta">
      <span class="badge ${getCategoryClass(place.category)}">${place.category}</span>
      ${place.district} District
    </p>
    <p>${place.description}</p>
    <p class="fee">Entry: ${describeFee(place.entryFeeUSD)}</p>
    <a href="details.html?id=${place.id}">View details</a>
  `;
  return card;
}

// Shows a spinning circle and a message inside any element
function showLoading(element, text) {
  element.innerHTML = `
    <div class="loading">
      <span class="spinner"></span>
      <span>${text}</span>
    </div>
  `;
}

// Shows an error message inside any element
function showError(element, text) {
  element.innerHTML = `<p class="error">${text}</p>`;
}

// ===== 4. HOME PAGE =====
async function initHomePage() {
  const featuredSection = document.querySelector('#featured');
  if (!featuredSection) return; // not on the Home page, so do nothing

  try {
    const destinations = await loadDestinations();
    const featured = destinations.filter(place => place.featured === true);
    for (const place of featured) {
      featuredSection.appendChild(createCard(place));
    }
  } catch (error) {
    featuredSection.insertAdjacentHTML('beforeend',
      `<p class="error">Featured destinations could not be loaded.</p>`);
    console.error(error);
  }
}

// ===== 5. DESTINATIONS PAGE =====
async function initDestinationsPage() {
  const list = document.querySelector('#destination-list');
  if (!list) return; // not on the Destinations page

  const searchInput = document.querySelector('#search');
  const categorySelect = document.querySelector('#category');
  const sortSelect = document.querySelector('#sort');
  const clearButton = document.querySelector('#clear-filters');
  const resultCount = document.querySelector('#result-count');

  let allDestinations = [];
  showLoading(list, 'Loading destinations...');

  try {
    allDestinations = await loadDestinations();
  } catch (error) {
    showError(list, 'Sorry, destinations could not be loaded. Please try again later.');
    console.error(error);
    return;
  }

  const updateMapPins = showAllDestinationsMap(allDestinations);

  function updateList() {
    const searchText = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const sortBy = sortSelect.value;

    // 1. FILTER: keep places that match the search text AND the category
    const results = allDestinations.filter(function (place) {
      const matchesSearch =
        place.name.toLowerCase().includes(searchText) ||
        place.district.toLowerCase().includes(searchText) ||
        place.description.toLowerCase().includes(searchText);
      const matchesCategory = category === 'all' || place.category === category;
      return matchesSearch && matchesCategory;
    });

    // 2. SORT the filtered copy
    if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'fee-low') {
      results.sort((a, b) => a.entryFeeUSD - b.entryFeeUSD);
    } else if (sortBy === 'fee-high') {
      results.sort((a, b) => b.entryFeeUSD - a.entryFeeUSD);
    }

    // 3. DRAW the cards
    list.innerHTML = '';
    if (results.length === 0) {
      list.innerHTML = '<p class="no-results">No destinations match your search.</p>';
    } else {
      for (const place of results) {
        list.appendChild(createCard(place));
      }
    }

    updateMapPins(results); // map shows only the matching pins
    resultCount.textContent = `Showing ${results.length} of ${allDestinations.length} destinations`;
  }

  // Redraw whenever the user types or changes a menu
  searchInput.addEventListener('input', updateList);
  categorySelect.addEventListener('change', updateList);
  sortSelect.addEventListener('change', updateList);

  // Clear filters: reset all three controls and redraw the full list
  clearButton.addEventListener('click', function () {
    searchInput.value = '';
    categorySelect.value = 'all';
    sortSelect.value = 'name';
    updateList();
  });

  updateList(); // first draw when the page loads
}

// ===== 5b. API: WEATHER (Open-Meteo) =====
// Converts a WMO weather code into a description
function describeWeather(code) {
  if (code === 0) {
    return 'Clear sky';
  } else if (code <= 3) {
    return 'Partly cloudy';
  } else if (code === 45 || code === 48) {
    return 'Foggy';
  } else if (code >= 51 && code <= 57) {
    return 'Drizzle';
  } else if (code >= 61 && code <= 67) {
    return 'Rain';
  } else if (code >= 80 && code <= 82) {
    return 'Rain showers';
  } else if (code >= 95) {
    return 'Thunderstorm';
  } else {
    return 'Mixed conditions';
  }
}

// Extension: an emoji to go with each description
function weatherIcon(code) {
  const description = describeWeather(code);
  switch (description) {
    case 'Clear sky':
      return '☀️';
    case 'Partly cloudy':
      return '⛅';
    case 'Foggy':
      return '🌫️';
    case 'Drizzle':
    case 'Rain':
    case 'Rain showers':
      return '🌧️';
    case 'Thunderstorm':
      return '⛈️';
    default:
      return '🌤️';
  }
}

async function showWeather(place) {
  const box = document.querySelector('#weather');
  if (!box) return;
  showLoading(box, 'Loading weather...');

  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${place.lat}&longitude=${place.lng}`
    + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + '&timezone=Asia%2FColombo&forecast_days=3';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Weather API error (status ' + response.status + ')');
    }
    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    // Build one forecast box per day using the parallel arrays
    let forecastHtml = '';
    for (let i = 0; i < daily.time.length; i++) {
      const dayName = new Date(daily.time[i]).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short'
      });
      forecastHtml += `
        <div class="forecast-day">
          <strong>${dayName}</strong>
          <p>${weatherIcon(daily.weather_code[i])} ${describeWeather(daily.weather_code[i])}</p>
          <p>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°C</p>
          <p>Rain: ${daily.precipitation_probability_max[i]}%</p>
        </div>
      `;
    }

    box.innerHTML = `
      <div class="weather-now">
        <p class="temp">${Math.round(current.temperature_2m)}°C</p>
        <p>${weatherIcon(current.weather_code)} ${describeWeather(current.weather_code)}</p>
        <p>Humidity ${current.relative_humidity_2m}% · Wind ${current.wind_speed_10m} km/h</p>
      </div>
      <div class="forecast">${forecastHtml}</div>
    `;
  } catch (error) {
    showError(box, 'Weather is unavailable right now. Please try again later.');
    console.error(error);
  }
}

// ===== 5c. API: CURRENCY (Frankfurter) =====
let usdToLkrRate = null; // cached rate, empty until first loaded

async function getUsdToLkrRate() {
  if (usdToLkrRate !== null) {
    return usdToLkrRate; // already loaded: no second request
  }
  const response = await fetch('https://api.frankfurter.dev/v2/rate/usd/lkr');
  if (!response.ok) {
    throw new Error('Currency API error (status ' + response.status + ')');
  }
  const data = await response.json();
  usdToLkrRate = data.rate;
  return usdToLkrRate;
}

// 10800.4 becomes "Rs. 10,800"
function formatLkr(amount) {
  return 'Rs. ' + Math.round(amount).toLocaleString('en-LK');
}

async function showFeeInLkr(place) {
  const feeBox = document.querySelector('#fee-lkr');
  if (!feeBox || place.entryFeeUSD === 0) return; // nothing to convert for free places
  try {
    const rate = await getUsdToLkrRate();
    feeBox.textContent = ` ≈ ${formatLkr(place.entryFeeUSD * rate)}`;
  } catch (error) {
    feeBox.textContent = ''; // fail quietly: the USD price is still shown
    console.error(error);
  }
}

// ===== 5d. API: MAPS (Leaflet + OpenStreetMap) =====
// Adds the OpenStreetMap tiles and the required credit to any map
function addBaseLayer(map) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

// One destination, one pin (details page)
function showMap(place) {
  const mapBox = document.querySelector('#map');
  if (!mapBox) return;
  if (typeof L === 'undefined') { // Leaflet failed to load
    showError(mapBox, 'The map could not be loaded.');
    return;
  }
  mapBox.textContent = ''; // remove the placeholder text
  const map = L.map('map').setView([place.lat, place.lng], 13);
  addBaseLayer(map);
  L.marker([place.lat, place.lng])
    .addTo(map)
    .bindPopup(`<strong>${place.name}</strong><br>${place.district} District`)
    .openPopup();
}

// Every destination, one pin each (Destinations page).
// Returns a function that redraws the pins for a filtered list.
function showAllDestinationsMap(destinations) {
  const mapBox = document.querySelector('#all-map');
  if (!mapBox) return function () {};
  if (typeof L === 'undefined') {
    showError(mapBox, 'The map could not be loaded.');
    return function () {};
  }

  const map = L.map('all-map');
  addBaseLayer(map);
  const pins = L.layerGroup().addTo(map);

  function drawPins(places) {
    pins.clearLayers();
    const points = [];
    for (const place of places) {
      L.marker([place.lat, place.lng])
        .addTo(pins)
        .bindPopup(`
          <strong>${place.name}</strong><br>
          ${place.category}<br>
          <a href="details.html?id=${place.id}">View details</a>
        `);
      points.push([place.lat, place.lng]);
    }
    if (points.length > 0) {
      map.fitBounds(points, { padding: [30, 30], maxZoom: 10 }); // zoom to show every pin
    }
  }

  drawPins(destinations);
  return drawPins;
}

// ===== 5e. MY TRIP STORAGE (localStorage) =====
const TRIP_KEY = 'lankaExplorerTrip';
const TRAVELLERS_KEY = 'lankaExplorerTravellers';

// Returns the saved trip as an array of ids, or an empty array
function getTrip() {
  const saved = storageGet(TRIP_KEY);
  if (saved === null) {
    return [];
  }
  try {
    const trip = JSON.parse(saved);
    return Array.isArray(trip) ? trip : [];
  } catch (error) {
    return []; // damaged data: start again with an empty trip
  }
}

// Saves the trip and updates the counter in the navigation
function saveTrip(trip) {
  storageSet(TRIP_KEY, JSON.stringify(trip));
  updateTripCount();
}

function isInTrip(id) {
  return getTrip().includes(id);
}

function addToTrip(id) {
  const trip = getTrip();
  if (!trip.includes(id)) { // never add the same place twice
    trip.push(id);
    saveTrip(trip);
  }
}

function removeFromTrip(id) {
  const trip = getTrip().filter(tripId => tripId !== id);
  saveTrip(trip);
}

// Shows "My Trip (3)" in the navigation on every page
function updateTripCount() {
  const link = document.querySelector('nav a[href="trip.html"]');
  if (!link) return;
  const count = getTrip().length;
  if (count > 0) {
    link.textContent = `My Trip (${count})`;
  } else {
    link.textContent = 'My Trip';
  }
}

// Connects the details page button to the trip
function setupTripButton(place) {
  const button = document.querySelector('#add-to-trip');
  if (!button) return;

  // Makes the label match the saved state
  function refreshButton() {
    if (isInTrip(place.id)) {
      button.textContent = '✓ In My Trip (click to remove)';
      button.classList.add('added');
    } else {
      button.textContent = 'Add to My Trip';
      button.classList.remove('added');
    }
  }

  button.addEventListener('click', function () {
    if (isInTrip(place.id)) {
      removeFromTrip(place.id);
    } else {
      addToTrip(place.id);
    }
    refreshButton(); // state changed, so redraw
  });

  refreshButton(); // correct label as soon as the page opens
}

// ===== 6. DETAILS PAGE =====
async function initDetailsPage() {
  const container = document.querySelector('#destination');
  if (!container) return; // not on the Details page

  // Hides the weather, map and button when there is no destination to show
  function hideExtras() {
    document.querySelector('#add-to-trip').hidden = true;
    document.querySelectorAll('#weather, #map').forEach(function (box) {
      box.parentElement.hidden = true;
    });
  }

  // Read the id from the address bar, e.g. details.html?id=3
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id'));

  showLoading(container, 'Loading destination...');

  try {
    const destinations = await loadDestinations();
    const place = destinations.find(p => p.id === id);

    if (!place) {
      container.innerHTML = `
        <h1>Destination not found</h1>
        <p><a href="destinations.html">Back to all destinations</a></p>
      `;
      hideExtras();
      return;
    }

    document.title = `${place.name} | Lanka Explorer`; // updates the browser tab

    // Free places show only "Free"; paid places add their price band
    const priceBand = place.entryFeeUSD > 0 ? ` (${getPriceLabel(place.entryFeeUSD)})` : '';

    container.innerHTML = `
      <img src="${place.image}" alt="${place.name}">
      <h1>${place.name}</h1>
      <p class="meta">
        <span class="badge ${getCategoryClass(place.category)}">${place.category}</span>
        ${place.district} District
      </p>
      <p>${place.description}</p>
      <h2>Quick Facts</h2>
      <ul>
        <li><strong>Best time to visit:</strong> ${place.bestTime}</li>
        <li><strong>Entry fee:</strong> ${formatFee(place.entryFeeUSD)}<span id="fee-lkr"></span>${priceBand}</li>
        <li><strong>Coordinates:</strong> ${place.lat}, ${place.lng}</li>
      </ul>
    `;

    showWeather(place);
    showFeeInLkr(place);
    showMap(place);
    setupTripButton(place);
  } catch (error) {
    showError(container, 'Sorry, this destination could not be loaded.');
    hideExtras();
    console.error(error);
  }
}

// ===== 6b. MY TRIP PAGE =====
async function initTripPage() {
  const tableBody = document.querySelector('#trip-table tbody');
  if (!tableBody) return; // not on the My Trip page

  const summary = document.querySelector('#trip-summary');
  const travellersInput = document.querySelector('#travellers');
  const totalUsdCell = document.querySelector('#total-usd');
  const totalLkrCell = document.querySelector('#total-lkr');
  const clearButton = document.querySelector('#clear-trip');

  showLoading(summary, 'Loading your trip...');

  let allDestinations = [];
  try {
    allDestinations = await loadDestinations();
  } catch (error) {
    showError(summary, 'Sorry, your trip could not be loaded.');
    console.error(error);
    return;
  }

  // The rupee figures are a bonus: the page still works in USD if this fails
  let rate = null;
  try {
    rate = await getUsdToLkrRate();
  } catch (error) {
    console.error(error);
  }

  // Restore the saved number of travellers
  travellersInput.value = storageGet(TRAVELLERS_KEY) || 1;

  function renderTrip() {
    const tripIds = getTrip();
    const places = allDestinations.filter(place => tripIds.includes(place.id));
    const travellers = Math.max(1, Number(travellersInput.value) || 1);

    tableBody.innerHTML = '';
    if (places.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="no-results">
            Your trip is empty. <a href="destinations.html">Browse destinations</a> to add some.
          </td>
        </tr>
      `;
    }

    let totalPerPerson = 0;
    for (const place of places) {
      totalPerPerson += place.entryFeeUSD;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="details.html?id=${place.id}">${place.name}</a></td>
        <td><span class="badge ${getCategoryClass(place.category)}">${place.category}</span></td>
        <td>${formatFee(place.entryFeeUSD)}</td>
        <td>${rate ? formatLkr(place.entryFeeUSD * rate) : '–'}</td>
        <td><button type="button" class="remove-btn" data-id="${place.id}">Remove</button></td>
      `;
      tableBody.appendChild(row);
    }

    const groupTotal = totalPerPerson * travellers;
    totalUsdCell.textContent = 'USD ' + groupTotal;
    totalLkrCell.textContent = rate ? formatLkr(groupTotal * rate) : 'Unavailable';

    summary.textContent = `${places.length} destination(s) for ${travellers} traveller(s).`;
    if (rate) {
      summary.textContent += ` Exchange rate used: 1 USD = Rs. ${rate.toFixed(2)}.`;
    }

    // Extension: the most expensive place and its share of the total cost
    if (groupTotal > 0) {
      const priciest = places.slice().sort((a, b) => b.entryFeeUSD - a.entryFeeUSD)[0];
      const share = Math.round((priciest.entryFeeUSD / totalPerPerson) * 100);
      summary.textContent += ` Most expensive: ${priciest.name} (${share}% of the total).`;
    }

    clearButton.hidden = places.length === 0;
  }

  // One listener on the table handles every Remove button (event delegation)
  tableBody.addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-btn')) {
      const id = Number(event.target.dataset.id);
      removeFromTrip(id);
      renderTrip();
    }
  });

  travellersInput.addEventListener('input', function () {
    storageSet(TRAVELLERS_KEY, travellersInput.value);
    renderTrip();
  });

  clearButton.addEventListener('click', function () {
    if (confirm('Remove every destination from your trip?')) {
      saveTrip([]);
      renderTrip();
    }
  });

  renderTrip();
}

// ===== 7. ENQUIRY FORM =====
function initEnquiryForm() {
  const form = document.querySelector('#enquiry-form');
  if (!form) return; // not on the About page

  const message = document.querySelector('#form-message');

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // stop the page from reloading

    const name = document.querySelector('#name').value.trim();
    const email = document.querySelector('#email').value.trim();
    const date = document.querySelector('#date').value;
    const people = Number(document.querySelector('#people').value);
    const note = document.querySelector('#message').value;
    const interests = form.querySelectorAll('input[name="interest"]:checked');

    const errors = [];

    if (name.length < 3) {
      errors.push('Please enter your full name (at least 3 characters).');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errors.push('Please enter a valid email address.');
    }

    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // "T00:00:00" makes the date count as local time, not UTC
      if (new Date(date + 'T00:00:00') < today) {
        errors.push('The travel date cannot be in the past.');
      }
    }

    if (people < 1 || people > 20) {
      errors.push('Number of travellers must be between 1 and 20.');
    }

    if (interests.length === 0) {
      errors.push('Please choose at least one interest.');
    }

    // Extra rule: the message must be no longer than 500 characters
    if (note.length > 500) {
      errors.push('Your message must be 500 characters or fewer (currently ' + note.length + ').');
    }

    // Show the result
    if (errors.length > 0) {
      message.className = 'form-error';
      message.innerHTML = '<ul>' + errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
    } else {
      message.className = 'form-success';
      message.textContent = `Thank you, ${name}! We will contact you at ${email} within 24 hours.`;
      form.reset();
    }
  });
}

// ===== 8. START THE APP =====
updateTripCount();
initHomePage();
initDestinationsPage();
initDetailsPage();
initTripPage();
initEnquiryForm();
