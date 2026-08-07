import { useEffect, useState } from 'react';
import countries from '../data/countries.js';
import { distKm, bearingDeg, distancePercent } from '../lib/geo.js';
import { colorForPct, WIN_COLOR } from '../lib/color.js';
import { pickRandomTarget } from '../lib/dailyPuzzle.js';
import { countryIds } from './useGameState.js';

const MAX_GUESSES = 6;
const STATE_KEY = 'globle_endless_state';
const STATS_KEY = 'globle_endless_stats';

// Same round persistence as the daily hook, minus the date-keyed
// invalidation — an endless round just picks up where it left off whenever
// you come back, until you finish it or start a new one.
function loadSaved(fallbackTarget) {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        target: s.target,
        guesses: s.guesses,
        gameState: s.gameState,
        showModal: s.gameState !== 'playing' && !s.dismissed,
      };
    }
  } catch {
    // ignore corrupt localStorage
  }
  return { target: fallbackTarget, guesses: [], gameState: 'playing', showModal: false };
}

// "Streak" here means consecutive rounds won in a row (resets on a loss),
// not consecutive days — there's no day concept in endless mode. Kept
// entirely separate from the daily stats/Firestore sync; this is
// localStorage-only by design.
function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s) return s;
  } catch {
    // ignore corrupt localStorage
  }
  return { streak: 0, played: 0, avg: '0.0', totalGuesses: 0 };
}

function persistStats(stats) {
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

export function useEndlessGameState() {
  // stats live inside the same state object as the round (not a separate
  // useState) so a finished round can be scored in a single, pure updater —
  // no setState call nested inside another updater's callback. Nesting them
  // is what caused the daily hook's zoom-bug-shaped sibling: React
  // StrictMode double-invokes updater functions in development to catch
  // impure code, so a nested setStats call fires twice per finish and
  // double-counts "played". (Daily happens to dodge this by accident, via
  // its `lastPlayed === dateKey` guard rejecting the second, redundant
  // invocation — endless has no such date to key off, so it needs to avoid
  // the nested-updater pattern instead.)
  const [state, setState] = useState(() => ({
    ...loadSaved(pickRandomTarget(countryIds)),
    stats: loadStats(),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          target: state.target,
          guesses: state.guesses,
          gameState: state.gameState,
          dismissed: !state.showModal,
        })
      );
    } catch {
      // storage unavailable — persistence is best-effort
    }
  }, [state]);

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
      if (finished) {
        const played = (prev.stats.played || 0) + 1;
        const totalGuesses = (prev.stats.totalGuesses || 0) + guesses.length;
        stats = {
          streak: won ? (prev.stats.streak || 0) + 1 : 0,
          played,
          totalGuesses,
          avg: (totalGuesses / played).toFixed(1),
        };
        persistStats(stats);
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
  function startNewRound() {
    setState((prev) => ({
      ...prev,
      target: pickRandomTarget(countryIds, prev.target),
      guesses: [],
      gameState: 'playing',
      showModal: false,
    }));
  }

  return {
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
    startNewRound,
  };
}
