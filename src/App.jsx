import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import SearchBox from './components/SearchBox.jsx';
import MapView from './components/MapView.jsx';
import ProximityLegend from './components/ProximityLegend.jsx';
import GuessList from './components/GuessList.jsx';
import AiAgentFacts from './components/AiAgentFacts.jsx';
import ResultModal from './components/ResultModal.jsx';
import ShowResultButton from './components/ShowResultButton.jsx';
import MobileLayout from './components/MobileLayout.jsx';
import { useGameState } from './hooks/useGameState.js';
import { useEndlessGameState } from './hooks/useEndlessGameState.js';
import { useFitScale } from './hooks/useFitScale.js';
import { useAuth } from './hooks/useAuth.js';
import { useIsMobile } from './hooks/useIsMobile.js';
import { useHardMode } from './hooks/useHardMode.js';

// Reference design size the whole game is laid out at; useFitScale scales
// this single fixed composition uniformly to fit any viewport, so nothing
// (including the proximity legend) ever requires scrolling to see. Only
// applies above the mobile breakpoint — see MobileLayout.jsx for why phones
// get a genuinely different, naturally-scrolling layout instead.
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 800;

export default function App() {
  const { user, authReady, signIn, signOut, isConfigured } = useAuth();
  const [mode, setMode] = useState('daily');
  const [hardMode, setHardMode] = useHardMode();
  const isMobile = useIsMobile();
  // Both modes stay mounted regardless of which is active (Rules of Hooks,
  // and it's cheap) — switching the toggle just swaps which one feeds the
  // shared UI below, so each mode's map coloring/guesses/modal state stays
  // fully independent and is preserved when you switch away and back.
  const dailyGame = useGameState(user);
  const endlessGame = useEndlessGameState();
  const active = mode === 'daily' ? dailyGame : endlessGame;

  const scale = useFitScale(STAGE_WIDTH, STAGE_HEIGHT);
  const guessedIds = useMemo(() => new Set(active.guesses.map((g) => g.id)), [active.guesses]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      console.info('[globle] target country:', active.targetId, active.target?.name);
    }
  }, [active.targetId, active.target]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    []
  );

  if (isMobile) {
    return (
      <MobileLayout
        mode={mode}
        onModeChange={setMode}
        dateLabel={dateLabel}
        puzzleNum={dailyGame.puzzleNum}
        hardMode={hardMode}
        onHardModeChange={setHardMode}
        user={user}
        authReady={authReady}
        isConfigured={isConfigured}
        onSignIn={signIn}
        onSignOut={signOut}
        active={active}
        guessedIds={guessedIds}
        onPlayAgain={endlessGame.startNewRound}
      />
    );
  }

  return (
    <div className="gc-stage">
      <div className="gc-app" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}>
        <Header
          mode={mode}
          onModeChange={setMode}
          dateLabel={dateLabel}
          puzzleNum={dailyGame.puzzleNum}
          streak={active.stats.streak}
          guessCountLabel={`${active.guesses.length}/6`}
          hardMode={hardMode}
          onHardModeChange={setHardMode}
          user={user}
          authReady={authReady}
          isConfigured={isConfigured}
          onSignIn={signIn}
          onSignOut={signOut}
        />

        <div className="gc-body">
          <div className="gc-main">
            <SearchBox guessedIds={guessedIds} onGuess={active.handleGuess} disabled={active.gameOver} />
            <MapView
              guesses={active.guesses}
              gameState={active.gameState}
              targetId={active.targetId}
              onGuess={active.handleGuess}
            />
            <ProximityLegend />
          </div>

          <aside className="gc-sidebar">
            <GuessList guesses={active.guesses} hardMode={hardMode} />
            {/* Mounts fresh (replaying its slide-in animation) specifically when
                the modal closes, not simultaneously with it opening — while the
                modal is open its own copy is what's visible; this one "pops up"
                in the sidebar's original spot right as the modal goes away. */}
            {active.gameOver && !active.showModal && <AiAgentFacts targetId={active.targetId} />}
          </aside>
        </div>

        <ResultModal
          mode={mode}
          show={active.showModal}
          onClose={active.closeModal}
          onPlayAgain={endlessGame.startNewRound}
          gameState={active.gameState}
          target={active.target}
          targetId={active.targetId}
          guesses={active.guesses}
          stats={active.stats}
          puzzleNum={dailyGame.puzzleNum}
        />

        {active.gameOver && !active.showModal && (
          <div className="gc-floating-actions">
            <ShowResultButton onClick={active.openModal} />
            {mode === 'endless' && (
              <button className="gc-play-again-float" onClick={endlessGame.startNewRound}>
                Play again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
