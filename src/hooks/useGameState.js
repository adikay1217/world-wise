import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import countries from '../data/countries.js';
import { distKm, bearingDeg, distancePercent } from '../lib/geo.js';
import { colorForPct, WIN_COLOR } from '../lib/color.js';
import { todayKey, pickTarget, puzzleNumber } from '../lib/dailyPuzzle.js';
import { db } from '../lib/firebase.js';

const MAX_GUESSES = 6;
const STATE_KEY = 'globle_state';
const STATS_KEY = 'globle_stats';

const countryIds = Object.keys(countries);

function wantsReset() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('reset') === '1';
}

function loadSaved(dateKey, fallbackTarget) {
  // Lets today's puzzle be replayed from scratch via a one-time
  // ?reset=1 URL flag, without touching overall stats/streak.
  if (wantsReset()) {
    try {
      localStorage.removeItem(STATE_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState(null, '', url);
    } catch {
      // best-effort cleanup of the flag/state
    }
    return { target: fallbackTarget, guesses: [], gameState: 'playing', showModal: false };
  }
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.date === dateKey) {
        return {
          target: s.target,
          guesses: s.guesses,
          gameState: s.gameState,
          showModal: s.gameState !== 'playing' && !s.dismissed,
        };
      }
    }
  } catch {
    // ignore corrupt localStorage
  }
  return { target: fallbackTarget, guesses: [], gameState: 'playing', showModal: false };
}

function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s) return s;
  } catch {
    // ignore corrupt localStorage
  }
  return { streak: 0, played: 0, avg: '0.0', totalGuesses: 0, lastPlayed: null };
}

// Signed-in players get their stats stored in Firestore (`users/{uid}`) so
// they follow across devices; signed-out play keeps using localStorage
// exactly as before. Firestore failures fall back to whatever's already in
// state rather than throwing, so a network hiccup can't break the game.
function persistStats(stats, user) {
  if (user && db) {
    setDoc(doc(db, 'users', user.uid), stats).catch((err) => {
      console.error('[stats] failed to save to Firestore:', err);
    });
    return;
  }
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // storage unavailable — persistence is best-effort
  }
}

function buildGuess(id, target, won) {
  const c = countries[id];
  const tgt = countries[target];
  const dist = distKm(c.lat, c.lon, tgt.lat, tgt.lon);
  const bearing = bearingDeg(c.lat, c.lon, tgt.lat, tgt.lon);
  const pct = distancePercent(dist);
  const fillColor = won ? WIN_COLOR : colorForPct(pct);
  return {
    id,
    name: c.name,
    dist,
    distLabel: won ? '0 km — found it!' : `${Math.round(dist).toLocaleString()} km`,
    bearing: won ? 0 : bearing,
    isWin: won,
    isDirectional: !won,
    fillColor,
    bg: won ? 'oklch(85% 0.16 145 / .3)' : colorForPct(pct, 0.22),
    chip: fillColor,
  };
}

export function useGameState(user) {
  const dateKey = useMemo(() => todayKey(), []);
  const target = useMemo(() => pickTarget(countryIds, dateKey), [dateKey]);

  // stats live inside the same state object as the round (not a separate
  // useState) so a finished round can be scored in a single, pure updater —
  // no setState call nested inside another updater's callback. Nesting them
  // used to work only by accident: React StrictMode double-invokes updater
  // functions in development to catch impure code, so a nested setStats
  // call fires twice per finish; the only reason it didn't double-count here
  // was the `lastPlayed === dateKey` guard rejecting the second, redundant
  // invocation. Keeping that guard (it's still meaningful — don't recount an
  // already-finished day) but no longer relying on it to mask the nesting
  // bug, since the sibling endless-mode hook doesn't have a date to guard
  // with and hit the bug directly.
  const [state, setState] = useState(() => ({
    ...loadSaved(dateKey, target),
    stats: loadStats(),
  }));

  // Load stats for whichever identity is current: Firestore when signed in,
  // localStorage otherwise. On a user's very first sign-in (no Firestore doc
  // yet), seed their cloud doc from whatever's already in localStorage so
  // guest progress isn't discarded.
  useEffect(() => {
    if (!user || !db) {
      setState((prev) => ({ ...prev, stats: loadStats() }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (cancelled) return;
        if (snap.exists()) {
          setState((prev) => ({ ...prev, stats: snap.data() }));
        } else {
          const seed = loadStats();
          await setDoc(ref, seed);
          if (!cancelled) setState((prev) => ({ ...prev, stats: seed }));
        }
      } catch (err) {
        console.error('[stats] Firestore load failed, staying on local stats:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          date: dateKey,
          target: state.target,
          guesses: state.guesses,
          gameState: state.gameState,
          dismissed: !state.showModal,
        })
      );
    } catch {
      // storage unavailable — persistence is best-effort
    }
  }, [dateKey, state]);

  function handleGuess(id) {
    setState((prev) => {
      if (prev.gameState !== 'playing') return prev;
      if (!countries[id]) return prev;
      if (prev.guesses.some((g) => g.id === id)) return prev;

      const won = id === prev.target;
      const guess = buildGuess(id, prev.target, won);
      const guesses = [guess, ...prev.guesses];
      const gameState = won ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
      const finished = gameState !== 'playing';

      let stats = prev.stats;
      if (finished && prev.stats.lastPlayed !== dateKey) {
        const played = (prev.stats.played || 0) + 1;
        const totalGuesses = (prev.stats.totalGuesses || 0) + guesses.length;
        stats = {
          streak: won ? (prev.stats.streak || 0) + 1 : 0,
          played,
          totalGuesses,
          avg: (totalGuesses / played).toFixed(1),
          lastPlayed: dateKey,
        };
        persistStats(stats, user);
      }

      return { ...prev, guesses, gameState, showModal: finished, stats };
    });
  }

  function closeModal() {
    setState((prev) => ({ ...prev, showModal: false }));
  }
  function openModal() {
    setState((prev) => ({ ...prev, showModal: true }));
  }

  return {
    dateKey,
    puzzleNum: puzzleNumber(dateKey),
    target: countries[state.target],
    targetId: state.target,
    guesses: state.guesses,
    gameState: state.gameState,
    gameOver: state.gameState !== 'playing',
    showModal: state.showModal,
    stats: state.stats,
    handleGuess,
    closeModal,
    openModal,
  };
}

export { countryIds };
