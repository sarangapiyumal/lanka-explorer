# Lanka Explorer

> Discover the Pearl of the Indian Ocean.

**Group name:** Lanka Explorer Team  *(replace with your group name)*
**Live link:** *(add your Netlify / GitHub Pages link here if you deploy)*

## Group members and roles

| Member | Role |
| --- | --- |
| Member Name 1 | Project Lead |
| Member Name 2 | Content Lead |
| Member Name 3 | Data Lead |
| Member Name 4 | UI Lead |

*(Replace the names above, and the names on `about.html`, with your real team.)*

## Project description

Lanka Explorer is a front-end web app that helps travellers discover Sri Lankan destinations and plan a trip.
It is built with plain HTML, CSS and JavaScript only. All destination data comes from `data/destinations.json`.

## Destinations

`data/destinations.json` holds **10 destinations** across four categories (Heritage, Beach, Nature, Wildlife).
Every one of them has a photo in `images/`.

Only **3 destinations are shown on the website**: Sigiriya Rock Fortress, Ella and Mirissa Beach
(they are also the 3 `"featured": true` places on the Home page).
The other 7 stay in the JSON file and the `images/` folder but are switched off with `"visible": false`:

| id | Destination | Category |
| --- | --- | --- |
| 1 | Sigiriya Rock Fortress | Heritage (shown) |
| 2 | Ella | Nature (shown) |
| 3 | Mirissa Beach | Beach (shown) |
| 4 | Anuradhapura | Heritage (hidden) |
| 5 | Temple of the Tooth | Heritage (hidden) |
| 6 | Arugam Bay | Beach (hidden) |
| 7 | Yala National Park | Wildlife (hidden) |
| 8 | Ambuluwawa Tower | Nature (hidden) |
| 9 | St Clair's Falls | Nature (hidden) |
| 10 | Coconut Tree Hill | Beach (hidden) |

**To show all 10:** set `SHOW_ALL_DESTINATIONS = true` at the top of `js/app.js`
(or change a destination's `"visible"` to `true` in the JSON file).
In the browser console, `await loadDestinations(true)` returns all 10 entries.

## Features

- Five linked pages with the same semantic header, navigation and footer
- Home page with featured destinations generated from JSON
- Destinations page: search (name, district, description), category filter, sort, result counter, "Clear filters", and a map whose pins follow the filter
- Details page driven by the URL (`details.html?id=1`): photo, facts, live weather and 3-day forecast, entry fee in USD and LKR, map, and an Add to My Trip button
- My Trip page: totals for any number of travellers in USD and LKR, saved in `localStorage`
- About page with an enquiry form and JavaScript validation (shows every error at once)
- Dark mode (saved, and follows the operating system by default)
- Responsive from 375 px to 1280 px+, with a mobile menu
- Loading spinners and friendly messages when an API or the map library fails

## APIs used

| API | Used for |
| --- | --- |
| Open-Meteo | Current weather and 3-day forecast |
| Frankfurter | USD to LKR exchange rate |
| Leaflet + OpenStreetMap | Interactive maps |

See `API-NOTES.md`.

## How to run

The site must be opened through a web server (browsers block `fetch()` on `file://` pages).

- **VS Code:** install *Live Server*, right-click `index.html` and choose **Open with Live Server**.
- **Or** from this folder run `python3 -m http.server 5500` and open <http://127.0.0.1:5500/>.

## Folder structure

```
lanka-explorer/
├── index.html  destinations.html  details.html  trip.html  about.html
├── README.md   API-NOTES.md
├── css/style.css
├── js/app.js
├── data/destinations.json
├── images/            (10 photos, about 1200 px wide, lowercase names)
└── screenshots/       (each page at 375 px and 1280 px, light and dark)
```

## Lighthouse scores

Run Lighthouse in Chrome DevTools (Mobile) on the Home and Details pages and record the scores here:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home | | | | |
| Details | | | | |

## Week 02 specificity answer

`#enquiry-form fieldset label` has an id selector, so it is more specific than `#enquiry-form label`
(which sets the bold weight for every label in the form). A plain `fieldset label` rule only has
element selectors, so the bolder `#enquiry-form label` rule wins and the checkbox labels would stay bold.
Adding `#enquiry-form` to the selector gives it higher specificity (an id plus two elements),
and it is also written later, so it wins.

## Notes on the data

- Entry fees are approximate foreign-adult prices in USD (Rs. 2000 is shown as USD 7). Confirm at the gate, because they change.
- The coordinates of the seven hidden destinations, especially Ambuluwawa Tower and St Clair's Falls, are approximate. Check them on Google Maps before you show those places.
- Photos in `images/` came from the supplied image pack. Check the licence of each photo before publishing the site.
