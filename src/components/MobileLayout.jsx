import Header from './Header.jsx';
import SearchBox from './SearchBox.jsx';
import MapView from './MapView.jsx';
import ProximityLegend from './ProximityLegend.jsx';
import GuessList from './GuessList.jsx';
import ResultModal from './ResultModal.jsx';
import ShowResultButton from './ShowResultButton.jsx';

// A genuinely different layout for small screens, not a scaled-down copy of
// the desktop one. Desktop lays everything out at a fixed 1280x800
// composition and uniformly scales it to fit (see useFitScale in App.jsx) —
// great for "nothing is ever cut off," bad for touch targets and text size
// on a phone, since it shrinks proportionally rather than reflowing. This
// stacks everything full-width instead, lets the page scroll naturally, and
// leans on the same ResultModal/MapView/etc. components (all already
// prop-driven, no changes needed) rather than duplicating game logic.
export default function MobileLayout({
  mode,
  onModeChange,
  dateLabel,
  puzzleNum,
  hardMode,
  onHardModeChange,
  user,
  authReady,
  isConfigured,
  onSignIn,
  onSignOut,
  active,
  guessedIds,
  onPlayAgain,
}) {
  return (
    <div className="gc-m-app">
      <Header
        mode={mode}
        onModeChange={onModeChange}
        dateLabel={dateLabel}
        puzzleNum={puzzleNum}
        streak={active.stats.streak}
        guessCountLabel={`${active.guesses.length}/6`}
        hardMode={hardMode}
        onHardModeChange={onHardModeChange}
        user={user}
        authReady={authReady}
        isConfigured={isConfigured}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />

      <div className="gc-m-body">
        <SearchBox guessedIds={guessedIds} onGuess={active.handleGuess} disabled={active.gameOver} />
        <div className="gc-m-map-wrap">
          <MapView
            guesses={active.guesses}
            gameState={active.gameState}
            targetId={active.targetId}
            onGuess={active.handleGuess}
          />
        </div>
        <ProximityLegend />

        <div className="gc-m-sidebar">
          <GuessList guesses={active.guesses} hardMode={hardMode} />
        </div>
      </div>

      <ResultModal
        mode={mode}
        show={active.showModal}
        onClose={active.closeModal}
        onPlayAgain={onPlayAgain}
        gameState={active.gameState}
        target={active.target}
        targetId={active.targetId}
        guesses={active.guesses}
        stats={active.stats}
        puzzleNum={puzzleNum}
      />

      {active.gameOver && !active.showModal && (
        <div className="gc-floating-actions">
          <ShowResultButton onClick={active.openModal} />
          {mode === 'endless' && (
            <button className="gc-play-again-float" onClick={onPlayAgain}>
              Play again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
