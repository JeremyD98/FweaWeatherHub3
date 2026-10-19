# AGENTS.md

Context for any AI assistant working on Fwea's Weather Hub. Read this before editing `index.html`.

## What it is

A personal daily weather PWA for Jeremy (Sydney, iPhone, home-screen install). The only job: answer "what do I wear today" in about three seconds, with personality. Glanceability and delight beat feature depth. It is not a product.

The shipped design is the Jobs edit: one screen, no scroll, the sky as the interface, everything else one tap away in a sheet. DESIGN.md is the spec. Do not add cards, rows or anything that scrolls to the main screen.

## Hard rules

- No em dashes anywhere: code comments, copy, docs. Use commas, colons, short sentences.
- The mood-line headlines in `MOOD_LINES` (two per band) are verbatim, Jeremy's own words, casing included ("an sVb good day"). Do not edit, reword, "fix" spelling or capitalise them without asking.
- Do not remove characters, add Google Analytics, cookies or consent banners without asking.
- No emoji in primary UI. Wear items use the single-stroke `ICONS` set.
- Playfair Display italic is the voice (verdict, characters). The temperature is Inter 200. Cormorant Garamond was tried and rejected (its "1" reads as "I").
- Pull-to-refresh is the one refresh gesture. Do not add refresh buttons.
- `index.html` stays one file. No modules, bundler, linter or formatter unless asked.
- Comments explain why, not what. No error handling for unreachable conditions. No feature flags.

## Files

| File | Role |
|---|---|
| `index.html` | The whole app: HTML, CSS, JS |
| `sw.js` | Service worker. `CACHE` must be bumped every deploy |
| `manifest.json` | PWA manifest |
| `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png` | Spring icon: a pale heart full of orange blossoms and a few leaves, on a soft sky. iOS needs the 180 PNG as `apple-touch-icon` |

## Architecture

- Static HTML/CSS/JS, served from GitHub Pages. No backend, no auth.
- State in `localStorage` under the `fwea.` prefix: `place`, `weather` (last response plus `fetchedAt`), `seenIntro`, `birthdayHello` (the year Voices last opened itself), and `last.<character>.<band>` for the anti-repeat picker.
- Data: Open-Meteo forecast API with `timezone=auto` and `forecast_days=7` (today and tomorrow read the first two days, the Week sheet reads all seven). Tomorrow mode needs daily `weather_code`, `wind_speed_10m_max`, `wind_gusts_10m_max` and hourly `apparent_temperature`, `relative_humidity_2m`; `canTomorrow(w)` refuses tomorrow on an older cached copy without them. Current fields are flattened onto the weather object, with `daily` and `hourly` alongside. All times are location-local ISO strings, read directly with `hourOf` and `minutesOf`.
- Geocoding: Open-Meteo geocoding API (search only; there is no reverse geocoding, so geolocation borrows a preset name when within about 2 km, otherwise says "Near you").
- No map. It was deleted with the Jobs edit, and Leaflet with it.
- Fonts: Playfair Display (italic) and Inter from Google Fonts.
- Service worker: cache-first for the same-origin shell, cache-then-refresh for fonts, never caches Open-Meteo (the app keeps its own last-known copy).

## The shared core block

The top of the `<script>` in `index.html` is the core block. It holds all the content logic, kept separate from the DOM code so it can be lifted into an LWC or a preview page as-is:

- `bandFor(feels)`: the seven bands from feels-like: `< -5` freezing, `< 5` cold, `< 12` chilly, `< 18` mild, `< 24` nice, `< 30` warm, else hot.
- `MOOD_LINES` and `moodLineFor(band)`: the verbatim headlines, two per band. The verdict alternates on every open and every refresh: a `moodTurn` counter in localStorage goes up once at boot, on each pull-to-refresh, and when the app resumes after 15 minutes away. It never changes mid-glance. Adding a line to a band just adds it to the rotation. `RAIN_MOOD_LINE` ("Rain Rain Rain Rain x2.... it's fun") joins the rotation while a rain code is current, and `SUN_MOOD_LINE` ("Sun Sun Sun Sun x2.... it's fun") while it is clear or mostly clear in daylight (`moodLinesFor(band, w)`). Both verbatim, Jeremy's casing. Neither applies on the birthday or in tomorrow mode.
- `BAND_WEAR` and `buildRecommendation(w)`: base outfit per band plus add-ons, capped at five items:
  - UV max >= 6 and daytime: Sunnies
  - Gusts >= 40 or wind >= 30: Secure hats
  - Snow codes: Snow boots (instead of any umbrella)
  - Raining now or `isRainingALot`: Umbrella
  - Otherwise rain probability max >= 40: Umbrella later
- `isRainingALot(w)`: daily precip sum >= 5 mm, or any hour today >= 1.5 mm, or heavy codes 65, 67, 82, 95, 96, 99.
- `tomorrowWeather(w)`: tomorrow shaped like a current-weather object, so every rule above reads it unchanged. `daily` and `hourly` are shifted so index 0 is tomorrow, `time` is tomorrow at midnight, `is_day` is 1, `tomorrow: true`. The number is the day's high; `apparent_temperature` (which picks the band and outfit) is the mean feels-like from 8am to 6pm; wind and gusts are the daily maxes; `weather_code` is the daily code; humidity is the 24-hour mean.
- `TOMORROW_VERDICT`: "tomorrow's weather". In tomorrow mode the verdict is this literal text, never a mood line. Jeremy's words, keep verbatim.
- `pickTintForWeather(w)`: rain, snow, hot, clear or none.
- `ICONS` and `iconSVG`: 14 single-stroke 24px glyphs that inherit `currentColor` (the 14th is `partyhat`). `SKY_ICONS` is a second set of seven for the week: sun, partly, cloud, fog, rain, storm, snow; `iconSVG(key, size, SKY_ICONS)` draws them.
- `animateNumber`: the count-up. See the gotcha below.
- `CHARACTERS`, `CHARACTER_LINES` (4 characters x 7 bands x 6 lines), `RAIN_LINES` (5 each), `SHREK_WELCOME_LINES` (3), `BIRTHDAY_CHARACTER_LINES` (2 each, approved by Jeremy).
- Fwea's birthday: `BIRTHDAY` ({ month: 11, day: 8 }, no year, so it repeats), `COUNTDOWN_DAYS` (3), `birthdayDaysAway(now)` (0 on the day, 1 to 3 before it, otherwise null, from the phone's local date), `countdownLine(days)`, `BIRTHDAY_VERDICTS` and `BIRTHDAY_EVE_VERDICT` ("birthday weather"). All verbatim, Jeremy's words. `buildRecommendation(w, moodTurn, birthday)` swaps the headline for a birthday verdict and adds the Party hat last, so the five-chip cap drops it when the weather fills the row. `characterLine(key, w, birthday)` uses only birthday lines on the day.
- `pickVariant` and `characterLine`: anti-repeat picker; rain lines override band lines when it is raining now or rain probability is at least 60%, but never during snow. Orange's rain lines interpolate `{RAIN}`.


## Features in index.html

The main screen (no scroll):
- Sky gradient chosen by `skyFor(w)`: clear, hot, rainy, freezing, mild or night.
- Location label (tap for Places) with staleness underneath: "just now", "X min ago", tinted past 30 minutes.
- Chat glyph top right (tap for Voices).
- Day label above the temperature: "Today · Tomorrow · Week" in 10px caps, the active day in full ink. Tap a word, or swipe sideways on the screen. Week is not a day: it opens the Week sheet.
- Temperature, verdict (mood line), aside ("Condition · feels X°").
- Tomorrow mode (`day = 1`, in memory only, never saved): the number is tomorrow's high, the verdict reads "tomorrow's weather", the aside is "Condition · low° to high°", the sky is the daytime sky for tomorrow's conditions, the wear row and sparkline are tomorrow's (no "now" dot). The Today sheet and Voices follow the day on screen: no hairline at now, stats headed "Tomorrow", characters talk about tomorrow. Every fresh open, and every resume after 15 minutes, starts on today.
- Wear row: up to five glass chips. Tapping one shows its note in the caption line for about 3 seconds.
- Sparkline of today's temperature with a "now" dot and a caption from `peakCaption`, with a small up chevron. Tap it, or swipe up anywhere on the screen, for Today.

One tap away, in bottom sheets. Sheets follow the finger: drag down from the top of a sheet to close it (80px or a flick commits, less snaps back). Scrim tap and Escape also close:
- Places: "Near me", presets from `PRESETS` (Sydney CBD, North Sydney CBD, Newcastle), debounced city search with disambiguation.
- Today: rain probability bars (24 hours, past ghosted, hairline at now; the label becomes "Rain probability, it's like a lawt" only when `isRainingALot` is true, nowhere else), four stat tiles (rain, wind, humidity, UV), sun arc with sunrise, daylight and sunset, and "replay the intro".
- Week: seven plain rows from today, built by `weekRows(w)` in the core block: day name (a small `partyhat` beside Fwea's birthday), a sky glyph from `SKY_ICONS` via `skyIconFor(code)` with the rain chance under it at 30% or more, the low, a white bar on one shared scale for the whole week, and the high. Today's bar has a dot at the current temperature. Rows are an overview only: nothing to tap, no outfits (wear lives in Today and Tomorrow). Always the real forecast, whichever day is on the main screen. Credits Open-Meteo.
- Voices: the four characters, opening on today's (rotates daily); tap a portrait to switch, "Another one" for a fresh line.

Behaviour:
- Auto-loads the saved place and renders the cached weather instantly, then refetches.
- First run without a saved place asks for geolocation, falling back to Sydney CBD.
- Main screen gestures: each touch picks a direction after its first 8px. Down is pull-to-refresh (threshold 90px). Up raises the Today sheet with the finger (80px or a quick flick opens it, less falls back). `sheetDrag` and `sheetRelease` drive both this and drag-to-close. Sideways turns the day: left for tomorrow, left again from tomorrow for the Week sheet (`goTo('week')`), right for today. The temperature block, wear row and sparkline (`.day-pane`) follow the finger at 35% (12% in the direction that leads nowhere); 80px or a flick commits via `setDay`, and the new day slides in from the side it came from.
- Trackpad sideways scroll and the left and right arrow keys also turn the day.
- Easter egg, weekdays only: hold the temperature for 500ms and one of Mawie's lines for the day (`MAWIE_LINES`, three per weekday, keyed by `getDay()`, 1 = Monday to 5 = Friday; a `mawieTurn` counter in localStorage moves to the next line on each hold) takes over the caption via `showCaptionNote`. The number dips to 96% with a soft glow under the thumb; the line stays while held and for 3 seconds after. Moving more than 8px cancels it (that's a swipe). Weekends: nothing. The lines are Jeremy's to reword; keep them lowercase.
- Trackpad or mouse wheel: scroll down to open Today, scroll up at the top of an open sheet to close it.
- Refetches on return to the app if data is older than 15 minutes.
- First visit: the main screen rises in piece by piece, the Voices sheet opens with Shrek's three welcome lines and closes itself after about 7 seconds, and the location label and chat glyph pulse.

## Voice

Warm, casual, occasionally deadpan, never precious. Lowercase for the headlines is deliberate.

- Rocky: hyphenated literal English, "amaze", "sad", ends questions with ", question?"
- WALL-E: chirpy, garbled, broken into syllables
- Remy: light French inflection, food metaphors
- Orange: chaotic, HEY-heavy, capitals

Character portraits are colour monogram medallions (`portraitSVG`). The colour is the character, and it is the only colour in the UI besides the sky.

## Fwea's birthday in index.html

- `isBirthdayView()`: the 8th, and the today view. Tomorrow's view of the 9th is never the birthday.
- `#countdown` sits above the day label and outside `.day-pane`, so it doesn't slide with a swipe. Hidden outside the window.
- The `birthday` sky is a seventh layer in `SKY_TOP`/`SKY_BOTTOM` and the CSS; `renderWeather` picks it over `skyFor(w)`.
- `confetti()`: a `.confetti` layer of 60 slips appended to `#app` and removed after 4.8s. Runs at boot, after a pull-to-refresh, and on resume after 15 minutes. Skipped with reduced motion.
- `birthdayHello()`: opens Voices once per birthday (`fwea.birthdayHello` stores the year), the first time there is weather, never over Shrek's welcome.
- To check it, set the phone's date to 5 to 8 November.

## Gotchas

- Bump `CACHE` in `sw.js` on every deploy. Bump the build number in the Today sheet footer (`<span id="version"> · v31</span>` in index.html) to match: it is how Jeremy checks his phone picked up a deploy.
- The count-up must write the final value synchronously first and only start its loop from `requestAnimationFrame`. Starting it synchronously can strand the start value on screen in a throttled or backgrounded tab.
- No `position: fixed` for anything that reaches the bottom of the screen. On iOS 26 home-screen apps with the see-through (`black-translucent`) status bar, iOS reports the viewport one status bar short and clips fixed layers to it, which left a strip at the bottom. The page itself still paints edge to edge, so the app is a normal page: `#app` is absolutely positioned and `--app-h` tall (the real screen height, measured in `fitToScreen()`), and the sky, main screen, scrim and sheets are absolutely positioned inside it. `touch-action: none` on the main screen and a scroll guard keep it feeling like one fixed screen. Only the pull-to-refresh pill and the Mawie hold glow stay fixed, since neither goes near the bottom.
- The main screen must never scroll: `html` and `body` are `overflow: hidden`, and the sheets scroll inside themselves. Check at 390x844 and at 375x667 (iPhone SE) with five chips.
- `backdrop-filter` has an opaque fallback via `@supports not`.
- iOS standalone often resumes an old JS session; swipe-close for a clean start and SW update pickup.
- Do not open via `file://`. Use `python3 -m http.server 4321`.
- When verifying edits in a browser, cache-bust with `?v=timestamp`.
