import AuthButton from './AuthButton.jsx';

export default function Header({
  mode,
  onModeChange,
  dateLabel,
  puzzleNum,
  streak,
  guessCountLabel,
  hardMode,
  onHardModeChange,
  user,
  authReady,
  isConfigured,
  onSignIn,
  onSignOut,
}) {
  return (
    <header className="gc-header">
      <div className="gc-header-row">
        <div className="gc-header-left">
          <div className="gc-title">World Wise</div>
          <div className="gc-mode-toggle">
            <button
              className={mode === 'daily' ? 'gc-mode-btn gc-mode-btn-active' : 'gc-mode-btn'}
              onClick={() => onModeChange('daily')}
            >
              Daily
            </button>
            <button
              className={mode === 'endless' ? 'gc-mode-btn gc-mode-btn-active' : 'gc-mode-btn'}
              onClick={() => onModeChange('endless')}
            >
              Endless
            </button>
          </div>
          {mode === 'daily' ? (
            <div className="gc-date">
              {dateLabel} · #{puzzleNum}
            </div>
          ) : (
            <div className="gc-date">Endless practice</div>
          )}
          <div className="gc-info-badge">
            i
            <span className="gc-info-tooltip">
              Click a country on the map or type its name to find the right one. After each guess, the map colors by
              how close you were — pale yellow is far, deep red is hot, green means you found it.
            </span>
          </div>
          <label className="gc-hardmode-toggle" title="Hides the direction arrow on guesses">
            <input type="checkbox" checked={hardMode} onChange={(e) => onHardModeChange(e.target.checked)} />
            <span className="gc-hardmode-track">
              <span className="gc-hardmode-thumb" />
            </span>
            Hard mode
          </label>
        </div>
        <div className="gc-header-right">
          <AuthButton
            user={user}
            authReady={authReady}
            isConfigured={isConfigured}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
          <div className="gc-header-stats">
            <div className="gc-streak">🔥 {streak}</div>
            <div className="gc-guess-count">
              Guesses <span>{guessCountLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
