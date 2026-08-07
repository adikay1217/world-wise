import { useEffect, useState } from 'react';
import { msUntilNextUtcMidnight } from '../lib/dailyPuzzle.js';
import { SHARE_EMOJI } from '../lib/color.js';
import AiAgentFacts from './AiAgentFacts.jsx';

function formatCountdown(ms) {
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
  const s = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function useCountdown() {
  const [ms, setMs] = useState(() => msUntilNextUtcMidnight());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextUtcMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  return formatCountdown(ms);
}

export default function ResultModal({
  mode,
  show,
  onClose,
  onPlayAgain,
  gameState,
  target,
  targetId,
  guesses,
  stats,
  puzzleNum,
}) {
  const countdown = useCountdown();
  const [shareLabel, setShareLabel] = useState('Share result');
  if (!show) return null;

  const won = gameState === 'won';
  const isDaily = mode === 'daily';

  function share() {
    const grid = guesses
      .slice()
      .reverse()
      .map((_, i) => SHARE_EMOJI[Math.min(i, 5)])
      .join('');
    const label = isDaily ? `World Wise #${puzzleNum}` : 'World Wise (Endless)';
    const text = `${label} ${won ? guesses.length : 'X'}/6\n${grid}`;
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setShareLabel('Copied!');
          setTimeout(() => setShareLabel('Share result'), 1500);
        })
        .catch(() => {});
    }
  }

  return (
    <div className="gc-modal-backdrop">
      <div className="gc-modal">
        <button className="gc-modal-close" onClick={onClose}>
          ×
        </button>
        <div className="gc-modal-headline" style={{ color: won ? '#2f6b3a' : '#c5502a' }}>
          {won ? 'You found it!' : 'Out of guesses'}
        </div>
        <div className="gc-modal-target">{target.name}</div>
        <div className="gc-modal-sub">
          {won
            ? `Solved in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}`
            : isDaily
              ? 'Better luck on the next globe'
              : 'Better luck next round'}
        </div>
        <div className="gc-modal-chips">
          {guesses.map((g) => (
            <span key={g.id} className="gc-modal-chip" style={{ background: g.chip }} />
          ))}
        </div>
        <div className="gc-modal-stats">
          <div>
            <div className="gc-modal-stat-value" style={{ color: '#c5502a' }}>
              🔥 {stats.streak}
            </div>
            <div className="gc-modal-stat-label">streak</div>
          </div>
          <div>
            <div className="gc-modal-stat-value">{stats.played}</div>
            <div className="gc-modal-stat-label">played</div>
          </div>
          <div>
            <div className="gc-modal-stat-value">{stats.avg}</div>
            <div className="gc-modal-stat-label">avg guesses</div>
          </div>
        </div>
        <AiAgentFacts targetId={targetId} />
        <div className="gc-modal-actions">
          <button className="gc-modal-share" onClick={share}>
            {shareLabel}
          </button>
          {isDaily ? (
            <div className="gc-modal-countdown">Next globe: {countdown}</div>
          ) : (
            <button className="gc-modal-share" onClick={onPlayAgain}>
              Play again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
