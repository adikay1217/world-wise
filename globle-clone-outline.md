# Globle Clone — Project Outline

## Concept
A daily country-guessing game. Every day, a target country is chosen (same for
all players, deterministic by date). Players click countries on a 2D world
map; each guess is colored/shaded by proximity and shows the direction to the
target, until the correct country is found.

## Tech Stack
- **React** — UI and game state
- **react-simple-maps** — SVG map rendering from GeoJSON/TopoJSON
- **d3-geo** (comes with react-simple-maps) — projections, centroid math
- Country boundary data: [Natural Earth](https://www.naturalearthdata.com/) or
  the `world-atlas` npm package (pre-built TopoJSON, includes country
  centroids/properties)
- No backend required initially — daily seed can be derived client-side from
  the date; state persists in `localStorage`

## Core Game Loop
1. On load, compute today's date → deterministic seed → pick target country
   from country list (same formula for every player = shared daily puzzle)
2. Player clicks a country shape on the map
3. App looks up guessed country's centroid (lat/lng) and computes:
   - **Distance** (haversine formula, target vs. guess centroid)
   - **Direction** (bearing formula, guess → target)
4. Guessed country is shaded on the map by proximity (color scale: far = cool,
   close = warm) and added to a guess list/sidebar with distance + arrow icon
5. Repeat until correct country is guessed
6. Win screen: number of guesses, option to share results (Wordle-style
   emoji/text summary), countdown to next day's puzzle

## Feature Breakdown (build order)

### Phase 1 — Static map + data
- [ ] Set up React app, install react-simple-maps + world-atlas
- [ ] Render world map with country borders
- [ ] Load/parse country list with centroids (lat/lng) and names
- [ ] Click handler on a country → log its name/id to console

### Phase 2 — Game logic (no daily seed yet, just random)
- [ ] Pick random target country on load
- [ ] Implement haversine distance function
- [ ] Implement bearing/direction function (return compass direction or arrow angle)
- [ ] On click: compute distance + direction from clicked country to target
- [ ] Display guess in a list (country name, distance, direction arrow)
- [ ] Detect win condition (guessed country === target)

### Phase 3 — Visual feedback
- [ ] Color-scale shading of guessed countries by proximity (closer = warmer)
- [ ] Highlight/disable already-guessed countries
- [ ] Win screen / modal with guess count

### Phase 4 — Daily puzzle logic
- [ ] Deterministic seed function based on current date (e.g. days since
      epoch → index into country list)
- [ ] Persist today's guesses in localStorage, keyed by date
- [ ] Countdown timer to next day's reset (local midnight)
- [ ] Reload should restore in-progress guesses for today, not reset

### Phase 5 — Polish
- [ ] Share button (generate Wordle-style result string)
- [ ] Mobile-friendly map interaction (touch, zoom/pan)
- [ ] Tooltip on hover showing country name before clicking
- [ ] Handle edge cases: tiny countries hard to click, disputed territories,
      countries with multiple non-contiguous parts (e.g. USA + Alaska)

## Key Technical Notes
- **Distance formula (haversine)**: standard great-circle distance between two
  lat/lng points — a few lines of math, no external library needed
- **Direction formula (bearing)**: computed from same two lat/lng points,
  convert result to either a compass label (N, NE, SE...) or a rotation angle
  for an arrow icon
- **Click hit-detection**: react-simple-maps' `<Geography>` components each
  correspond to one country feature from the TopoJSON — click handlers attach
  directly per-country, no manual coordinate math needed
- **Small-country problem**: since guessing is map-click only (no search
  fallback), consider a zoom feature or click-tolerance boost for tiny
  countries (e.g. Vatican, Singapore) so the game stays playable

## Open Questions / Later Decisions
- Exact color scale for proximity shading
- Share-result text format
