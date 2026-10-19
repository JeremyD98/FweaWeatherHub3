# DESIGN.md: the Jobs edit

The shipped design of Fwea's Weather Hub. The question is "what do I wear today", and the screen answers it and nothing else. Everything that doesn't serve the first half-second is deleted or one tap away.

## Principles

1. One screen, no scroll. On an iPhone the whole answer fits above the home indicator, even at five wear chips.
2. The sky is the interface. The whole viewport is one gradient that changes with the weather. There are no cards on the main screen.
3. Numbers thin, voice in serif. Inter 200 for the temperature, Playfair Display italic for the verdict and the characters.
4. One tap away, never in the way. Places, the day in detail, and the characters live in bottom sheets.
5. The ink is white. Everything inherits it, including the icons.

## The main screen, top to bottom

| Element | Detail |
|---|---|
| Location label | 13px, `--ink-soft`, tracking .06em. Staleness underneath in 10px caps ("just now", "12 min ago"); turns `--stale` past 30 minutes. Tap: Places sheet. |
| Chat glyph | Top right, faint, 44px target. Tap: Voices sheet, opening on today's character. |
| Day label | "Today · Tomorrow · Week" above the temperature. 10px caps, tracking .14em, `--ink-faint`, the active day in `--ink`, ghost dots between. Each word is a 44px tap target centred on its text (extra left padding cancels the trailing letter-spacing). Tap a word or swipe sideways. Week opens the Week sheet. |
| Temperature | Inter 200, clamp(120px, 40vw, 190px), tracking -.05em. Degree as a 40% superscript in `--ink-soft`. Count-up via `animateNumber`. |
| Verdict | The mood line, verbatim, alternating between each band's lines on every open and refresh. While it rains, "Rain Rain Rain Rain x2.... it's fun" joins the rotation; while it is sunny in daylight, "Sun Sun Sun Sun x2.... it's fun" does. Playfair Display italic, clamp(24px, 7vw, 30px). |
| Aside | "Condition · feels X°". Inter 14px, `--ink-soft`. |
| Wear row | 2 to 5 glass chips in one row, each a 22px single-stroke icon plus an 11.5px label. Tap a chip: its note replaces the sparkline caption for about 3 seconds. |
| Sparkline | Today's 24-hour temperature curve. No axes, no labels. A soft fill underneath, a white dot at now. Caption: "Peaks at 25° around 3pm." with a small up chevron. Tap it, or swipe up anywhere, for the Today sheet. |

## Tomorrow

The same screen, one swipe to the left. Nothing new is added; the answer changes underneath.

- The number is tomorrow's high. The verdict reads "tomorrow's weather", literally, never a mood line. The aside reads "Partly cloudy · 18° to 27°".
- The outfit is for how the day feels while you're out, 8am to 6pm, not the hottest hour.
- The sky is tomorrow's daytime sky, even at night: you're dressing for the day.
- The sparkline is tomorrow's whole day, with no "now" dot. The Today sheet and the characters follow along.
- It is never remembered. Every open starts on today.

## Skies

Each sky is a 172deg linear gradient. Layers crossfade over 1.4s because gradients can't transition.

| Sky | When | Stops |
|---|---|---|
| clear | codes 0 to 1, daytime | #0e1a3a, #22396b, #5677b0, #b79e8e |
| hot | feels >= 30, daytime | #2e0900, #8a2507, #df5a16, #f7a53f |
| rainy | any rain code | #161b22, #2c343f, #4d5764, #66707c |
| freezing | snow codes or feels <= -2 | #081222, #1d3553, #5f81a6, #b8cde0 |
| mild | everything else in daytime | #1e2431, #3a4456, #6c7688, #9aa2ae |
| night | not daytime, not rain or snow | #03050c, #0b1328, #1b2748, #2d3a5c |

`skyFor(w)` builds on `pickTintForWeather(w)`. The status bar (`theme-color`) takes the top stop.

The light source: a 130vmax radial white glow off the top-right corner, breathing between scale 1 and 1.08 over 9 seconds. Dimmed at night. Off with reduced motion.

## Tokens

```css
--ink: #ffffff;
--ink-soft: rgba(255,255,255,.74);
--ink-faint: rgba(255,255,255,.46);
--ink-ghost: rgba(255,255,255,.18);
--glass: rgba(255,255,255,.11);        /* chips, stat tiles, inputs */
--glass-edge: rgba(255,255,255,.22);
--sheet: rgba(18,22,32,.62);           /* bottom sheets, blur 30px */
--stale: #ffb4a4;
--serif: 'Playfair Display';
--sans: 'Inter';
```

Radii: chips 18px, sheets 28px top corners, pills fully round. No hard corners.

## Sheets

Bottom sheets with a grab handle and a dimming scrim. Only one is open at a time.

They move with your finger. Swiping up on the main screen (the gesture you'd use to scroll down a page) raises the Today sheet as you drag, with the scrim fading in to match; let go past 80px, or flick, and it settles open; otherwise it drops back. Dragging any sheet down from its top works the same way in reverse. The main screen still never scrolls: up means Today, down means refresh.

- **Places**: "Near me", the three presets, city search with a disambiguation list.
- **Today**: the 24-hour rain probability bars (past hours ghosted, hairline at now; the label reads "Rain probability, it's like a lawt" only when `isRainingALot`), four stat tiles (rain, wind, humidity, UV), the sun arc with sunrise, daylight and sunset, the Open-Meteo credit with the build number after it (" · v31", same 11px `--ink-faint`), and "replay the intro".
- **Week**: seven plain rows, today first, like a calendar glance. Each row: the day (15px, 500), a 22px single-stroke sky glyph with the rain chance in 10px under it when it's 30% or more, the low in `--ink-faint`, a 4px bar, the high. Every bar sits on one scale, the week's lowest low to its highest high, white on `--ink-ghost`; today's carries a white dot at the current temperature. No colour, no outfits, nothing to tap. Fwea's birthday gets a 14px party hat beside the day name. Reached by tapping Week, or swiping left from tomorrow.
- **Voices**: the four portrait medallions in a row, the active one ringed; name, role, the line in Playfair; "Another one". Shrek's welcome uses this sheet on first visit.

## Motion

- Temperature count-up, 650ms ease-out cubic.
- Wear chips rise in, 50ms apart.
- First visit: top bar, core, wear row and sparkline rise in 140ms apart; the Voices sheet opens with Shrek's three lines one by one; the location label and chat glyph pulse three times; the welcome closes itself after about 7 seconds.
- Turning the day: the answer follows the finger sideways, then the new day slides in from 40px over 420ms.
- On Fwea's birthday: one confetti burst (see below).
- Nothing else moves except the breathing light.

## Fwea's birthday (8 November, every year)

Counted from the phone's date.

| When | What changes |
|---|---|
| 5 to 7 Nov | One line in Playfair italic, 15px, `--ink-soft`, above the day label: "3 days till the big day", "2 days till the big day", "tomorrow's the big day". Nothing else changes. On 7 Nov, swiping to tomorrow makes the verdict "birthday weather". |
| 8 Nov | The line reads "it's the big day". The birthday sky replaces the weather sky all day. The verdict takes turns between "happy birthday bbygirl" and "it's ur day innit" (Jeremy's words, verbatim) on every open and refresh. A Party hat chip joins the wear row when the weather leaves a slot. Confetti falls once on open, on pull-to-refresh, and on returning after 15 minutes. The first open of the day opens Voices by itself, and every character's lines are birthday lines. |

The birthday belongs to today's view only: swiping to tomorrow on the 8th shows the 9th as normal.

| Sky | Stops |
|---|---|
| birthday | #2a0f2e, #6b2448, #d0646e, #f4b860 |

Confetti: 60 small rounded slips in white and the four character colours, so no new colour. They fall over 2.6 to 4 seconds with a little drift and spin, then the layer removes itself. Absolute inside `#app`, above the sheets, never catching a touch. Off with reduced motion.

## Easter egg

On weekdays, holding the temperature for half a second makes Mawie remind you about the stand up desk. The number dips to 96%, a soft white glow sits under your thumb, and the caption under the sparkline shows the day's line:

| Day | Lines (each hold shows the next one) |
|---|---|
| Mon | mawie says stand up desk today. monday legs, let's go / mawie says sitting is so last week / mawie says i'm ready, i'm ready, i'm ready... to stand at the desk |
| Tue | mawie says the stand up desk misses you / mawie says your chair needs a day off too / mawie says is sitting an instrument? no patrick. stand up |
| Wed | mawie says halfway there, stand for it / mawie says the desk goes up, the posture goes up / mawie says one eternity later... you're still sitting. desk up |
| Thu | mawie says raise the desk, raise the standards / mawie says stand up desk, stand up king / mawie says firmly grasp the desk. raise it |
| Fri | mawie says stand up desk now, sit down with a drink later / mawie says one meeting standing, that's all she asks / mawie says be spongebob at the grill, not patrick under the rock |

It stays while you hold and for 3 seconds after, then the forecast caption returns. Nothing on screen hints at it, and on weekends a hold does nothing.

## Deliberately deleted

The metric grid, labeled charts with axes, the columnist card, the always-visible sun card, the masthead, the preset chip row, pressure, visibility, and the map. Humidity and UV survive, one tap away.

## Not in this design

No emoji. No colour outside the sky and the portraits. No refresh button (pull down is the one gesture). No ten-day forecast: the week is enough, and it is an overview, not a way in. No scroll on the main screen.
