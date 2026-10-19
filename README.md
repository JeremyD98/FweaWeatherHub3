# Fwea's Weather Hub

A tiny personal weather app. Open it before you leave the house and it tells you the weather and what to wear, in about three seconds. With opinions.

One screen, no scroll: the sky, the temperature, a verdict, and the outfit. Swipe left for tomorrow, left again for the week, right to come back. Tap the place to change it, swipe up (or tap the little curve) for the day in detail, tap the speech bubble to hear from the characters. Pull down to refresh.

- Weather from [Open-Meteo](https://open-meteo.com). Free, no key.
- One static `index.html`. No build step, no backend, no tracking.
- Installs to the iPhone home screen as a PWA and works offline from the last fetch.

## Run it

```
cd "Weather Oct 26"
python3 -m http.server 4321
```

Open http://localhost:4321. Do not open the file directly (`file://`): some fetches and the service worker need a real origin.

## Put it on your phone

1. Push the folder to a GitHub repo and turn on Pages (Settings, Pages, deploy from branch).
2. Open the Pages URL in Safari on iPhone.
3. Share, Add to Home Screen.

## Ship a change

1. Edit the files.
2. Bump `CACHE` in `sw.js` (`fwea-hub-v31` to `fwea-hub-v32`, and so on). Skip this and installed copies stay stale.
3. Push. Pages redeploys in about a minute.
4. On iPhone, swipe the app closed and reopen it.

## What's in here

| File | What it is |
|---|---|
| `index.html` | The app. Everything lives here. |
| `sw.js`, `manifest.json` | PWA plumbing: offline cache and home-screen install |
| `icon.svg`, `icon-*.png` | The spring icon: a heart full of orange blossoms. PNGs because iOS ignores SVG touch icons. |
| `AGENTS.md` | Context for AI assistants working on the app |
| `DESIGN.md` | The design spec for the shipped app (the Jobs edit) |
| `PROJECT_HANDOFF.md` | The whole project in one document |
