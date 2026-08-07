export default function GuessList({ guesses }) {
  return (
    <>
      <div className="gc-sidebar-title">Guess history</div>
      {guesses.length === 0 && (
        <div className="gc-sidebar-empty">Search or click a country on the map to make your first guess.</div>
      )}
      {guesses.map((g) => (
        <div key={g.id} className="gc-guess-row" style={{ background: g.bg }}>
          <div className="gc-guess-info">
            <span className="gc-guess-name">{g.name}</span>
            <span className="gc-guess-dist">{g.distLabel}</span>
          </div>
          {g.isWin && <span className="gc-guess-star">★</span>}
          {g.isDirectional && (
            <span className="gc-guess-arrow" style={{ transform: `rotate(${g.bearing}deg)` }}>
              <svg viewBox="0 0 24 24" width="17" height="17">
                <path d="M12 2 L19.5 21 Q12 15.5 4.5 21 Z" fill="#2b2320" opacity=".62" />
              </svg>
            </span>
          )}
        </div>
      ))}
    </>
  );
}
