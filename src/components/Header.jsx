import AuthButton from './AuthButton.jsx';

export default function Header({
  dateLabel,
  puzzleNum,
  streak,
  guessCountLabel,
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
          <div className="gc-date">
            {dateLabel} · #{puzzleNum}
          </div>
          <div
            className="gc-info-badge"
            title="Guess the mystery country. After each guess, the map colors by how close you were — pale yellow is far, deep red is hot, green means you found it."
          >
            i
          </div>
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
      <div className="gc-subtitle">Click a country on the map or type its name to find the right one.</div>
    </header>
  );
}
