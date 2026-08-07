# World Wise — Project Overview

A country-guessing game inspired by Globle. Two ways to play:

- **Daily** — one target country per calendar day, shared by every player
  (deterministic from the date). Streak/played/avg stats build up day over
  day, the same as Wordle-style dailies.
- **Endless** — pick a random country and go, any time, as many rounds in a
  row as you want. Its own separate streak/played/avg, unrelated to the
  daily numbers.

In both modes: click countries on the world map (or type a name in the
search box); each guess is colored by proximity and shows the direction to
the target, until the right country is found or you run out of guesses (6).
**Hard mode** (toggle in the header, persisted locally) hides the direction
arrow on every guess — a pure display toggle, so switching it mid-game
retroactively hides/reveals arrows on guesses already made.

## Tech Stack
- **Vite + React** (plain JS) — UI and game state.
- **Raw inline SVG world map** (`src/assets/world-map.svg`, `<path id="xx">`
  per ISO 3166-1 alpha-2 country code) + a matching `{name, lat, lon}`
  centroid table (`src/data/countries.js`) — no map library
  (`react-simple-maps`/`world-atlas`, as originally considered, weren't
  needed once a hand-authored SVG + centroid data were available).
- **Firebase Auth** (Google sign-in) + **Firestore** — optional sign-in;
  signed-in players get their *daily* stats synced across devices. Endless
  stats and the in-progress round for both modes stay in the browser's
  `localStorage` only. The app runs fully as a guest with no Firebase project
  configured at all (see `.env.example`).
- Hosted on Vercel.

## How it works
- **Daily target**: `todayKey()` → a deterministic hash of the date picks the
  target from the country list — same country for every player on a given
  day (`src/lib/dailyPuzzle.js`, `pickTarget`).
- **Endless target**: `pickRandomTarget()` picks uniformly at random, only
  constrained to not repeat the round you just finished.
- **Distance/direction**: haversine distance and initial-bearing formulas
  (`src/lib/geo.js`) between the guessed country's centroid and the target's.
- **Proximity color**: an OKLCH gradient from pale yellow (far) to deep red
  (close), green on the correct answer (`src/lib/color.js`).
- **Game state**: `useGameState` (daily) and `useEndlessGameState` (endless)
  in `src/hooks/` — same shape (`target`, `guesses`, `gameState`, `stats`,
  `handleGuess`, ...), each persisted under its own `localStorage` keys
  (`globle_state`/`globle_stats` vs `globle_endless_state`/
  `globle_endless_stats`) so reloading mid-round never loses progress.
  `App.jsx` runs both hooks simultaneously and a header toggle just picks
  which one feeds the shared UI — so switching modes mid-session preserves
  each mode's guesses/map coloring independently.
- **Click hit-detection**: the SVG is injected once, imperatively, into the
  map container; a single delegated click listener resolves the clicked
  `<path>`/`<g>` id back to a country.
- **Map zoom/pan**: wheel-to-zoom (toward the cursor) and drag-to-pan,
  implemented with native DOM listeners rather than React state for the
  parts that need to stay perfectly in sync with pointer position — see the
  comments in `src/components/MapView.jsx` for the specific browser/React
  quirks that forced that approach (StrictMode double-invoking state
  updaters, `dangerouslySetInnerHTML` re-applying on every re-render,
  `setPointerCapture` breaking click hit-testing).
- **Fit-to-screen layout (desktop/tablet)**: above the mobile breakpoint
  (700px), the whole game is laid out at a fixed 1280×800 reference size and
  uniformly scaled to fit any viewport (`src/hooks/useFitScale.js`), so
  nothing — including the proximity legend — ever requires scrolling to see.
- **Mobile layout**: below 700px wide, `App.jsx` renders
  `src/components/MobileLayout.jsx` instead — a genuinely different,
  naturally-scrolling composition (stacked full-width sections, a
  bottom-sheet result modal) rather than a shrunk-down copy of the desktop
  one, so touch targets and text stay a real, usable size. Reuses the exact
  same `MapView`/`SearchBox`/`GuessList`/`ResultModal`/etc. components and
  game-state hooks as desktop — only the surrounding layout differs
  (`src/hooks/useIsMobile.js` picks which branch renders).
- **Share result**: a Wordle-style emoji-grid string copied to the clipboard,
  labeled with the puzzle number (daily) or "(Endless)".
- **Post-game facts**: inside the win/loss modal itself (not the sidebar —
  disappears when you close it, reappears if you reopen via "Show result"),
  a card titled "Facts about {country}" reveals population, GDP, primary
  language(s), and neighboring countries for the target, each stat sliding
  in in sequence (`src/components/AiAgentFacts.jsx`, rendered from
  `ResultModal.jsx`; data in `src/data/countryFacts.js`). This is real data
  (World Bank population/GDP + Wikidata official languages/borders), not
  LLM-generated text, specifically to avoid presenting hallucinated
  statistics as fact; see the header comment in `countryFacts.js` for exact
  sourcing and the handful of manually-corrected gaps (Taiwan/Falklands
  untracked by World Bank, North Korea's GDP genuinely unreported, a couple
  of Wikidata official-language omissions).
- **Signing in before/during/after playing**: `useGameState`'s Firestore-sync
  effect treats the cloud doc as the source of truth for everything except
  a just-finished local round the cloud hasn't seen yet — signing in right
  after playing as a guest folds that result into the cloud stats (correct
  streak baseline, no double-count) instead of the cloud fetch silently
  discarding it.

## Known small gaps
- Endless stats don't sync to Firestore even when signed in (daily-only for
  now).
- No handling yet for disputed territories / countries without an ISO code
  beyond what the source SVG already labels (e.g. Somaliland uses a
  non-ISO `_`-prefixed id and isn't guessable).
