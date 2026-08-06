import { useEffect, useMemo, useState } from 'react';
import countries from '../data/countries.js';
import { distKm, bearingDeg, distancePercent } from '../lib/geo.js';
import { colorForPct, WIN_COLOR } from '../lib/color.js';
import { todayKey, pickTarget, puzzleNumber } from '../lib/dailyPuzzle.js';

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

export function useGameState() {
  const dateKey = useMemo(() => todayKey(), []);
  const target = useMemo(() => pickTarget(countryIds, dateKey), [dateKey]);

  const [game, setGame] = useState(() => loadSaved(dateKey, target));
  const [stats, setStats] = useState(loadStats);

  useEffect(() => {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          date: dateKey,
          target: game.target,
          guesses: game.guesses,
          gameState: game.gameState,
          dismissed: !game.showModal,
        })
      );
    } catch {
      // storage unavailable — persistence is best-effort
    }
  }, [dateKey, game]);

  function handleGuess(id) {
    setGame((prev) => {
      if (prev.gameState !== 'playing') return prev;
      if (!countries[id]) return prev;
      if (prev.guesses.some((g) => g.id === id)) return prev;

      const won = id === prev.target;
      const guess = buildGuess(id, prev.target, won);
      const guesses = [guess, ...prev.guesses];
      const gameState = won ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
      const finished = gameState !== 'playing';

      if (finished) {
        setStats((s) => {
          if (s.lastPlayed === dateKey) return s;
          const played = (s.played || 0) + 1;
          const totalGuesses = (s.totalGuesses || 0) + guesses.length;
          const next = {
            streak: won ? (s.streak || 0) + 1 : 0,
            played,
            totalGuesses,
            avg: (totalGuesses / played).toFixed(1),
            lastPlayed: dateKey,
          };
          try {
            localStorage.setItem(STATS_KEY, JSON.stringify(next));
          } catch {
            // storage unavailable — persistence is best-effort
          }
          return next;
        });
      }

      return { ...prev, guesses, gameState, showModal: finished };
    });
  }

  function closeModal() {
    setGame((prev) => ({ ...prev, showModal: false }));
  }
  function openModal() {
    setGame((prev) => ({ ...prev, showModal: true }));
  }

  return {
    dateKey,
    puzzleNum: puzzleNumber(dateKey),
    target: countries[game.target],
    targetId: game.target,
    guesses: game.guesses,
    gameState: game.gameState,
    gameOver: game.gameState !== 'playing',
    showModal: game.showModal,
    stats,
    handleGuess,
    closeModal,
    openModal,
  };
}

export { countryIds };
