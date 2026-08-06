import { useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import SearchBox from './components/SearchBox.jsx';
import MapView from './components/MapView.jsx';
import ProximityLegend from './components/ProximityLegend.jsx';
import GuessList from './components/GuessList.jsx';
import ResultModal from './components/ResultModal.jsx';
import ShowResultButton from './components/ShowResultButton.jsx';
import { useGameState } from './hooks/useGameState.js';
import { useFitScale } from './hooks/useFitScale.js';

// Reference design size the whole game is laid out at; useFitScale scales
// this single fixed composition uniformly to fit any viewport, so nothing
// (including the proximity legend) ever requires scrolling to see.
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 800;

export default function App() {
  const game = useGameState();
  const scale = useFitScale(STAGE_WIDTH, STAGE_HEIGHT);
  const guessedIds = useMemo(() => new Set(game.guesses.map((g) => g.id)), [game.guesses]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      console.info('[globle] target country:', game.targetId, game.target?.name);
    }
  }, [game.targetId, game.target]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    []
  );

  return (
    <div className="gc-stage">
      <div className="gc-app" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: `scale(${scale})` }}>
        <Header
          dateLabel={dateLabel}
          puzzleNum={game.puzzleNum}
          streak={game.stats.streak}
          guessCountLabel={`${game.guesses.length}/6`}
        />

        <div className="gc-body">
          <div className="gc-main">
            <SearchBox guessedIds={guessedIds} onGuess={game.handleGuess} disabled={game.gameOver} />
            <MapView
              guesses={game.guesses}
              gameState={game.gameState}
              targetId={game.targetId}
              onGuess={game.handleGuess}
            />
            <ProximityLegend />
          </div>

          <GuessList guesses={game.guesses} />
        </div>

        <ResultModal
          show={game.showModal}
          onClose={game.closeModal}
          gameState={game.gameState}
          target={game.target}
          guesses={game.guesses}
          stats={game.stats}
          puzzleNum={game.puzzleNum}
        />

        {game.gameOver && !game.showModal && <ShowResultButton onClick={game.openModal} />}
      </div>
    </div>
  );
}
