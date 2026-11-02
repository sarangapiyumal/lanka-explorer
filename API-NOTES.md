# API Notes

## Open-Meteo (weather)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Parameters used:** `latitude`, `longitude`, `current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`, `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`, `timezone=Asia%2FColombo`, `forecast_days=3`
- **Key needed:** No
- **Learned:** the `daily` data is a set of parallel arrays, so index `i` in every array belongs to the same day. Weather is a numeric WMO code that we translate into words and an icon.

## Frankfurter (currency)
- **Endpoint:** `https://api.frankfurter.dev/v2/rate/usd/lkr`
- **Key needed:** No
- **Learned:** the response is one small object and the rupees per dollar is in `rate`. We cache it in `usdToLkrRate`, so the server is asked once per page load.

## Leaflet + OpenStreetMap (maps)
- **Library:** `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` and `.css`
- **Tiles:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Key needed:** No
- **Learned:** a map is built from many small tile images, the map container needs a fixed height, and the OpenStreetMap credit (attribution) is required.
