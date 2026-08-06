import { useMemo, useState } from 'react';
import countries from '../data/countries.js';
import { countryIds } from '../hooks/useGameState.js';

export default function SearchBox({ guessedIds, onGuess, disabled }) {
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return countryIds
      .filter((id) => !guessedIds.has(id) && countries[id].name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, guessedIds]);

  function pick(id) {
    onGuess(id);
    setQuery('');
  }

  return (
    <div className="gc-search">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && suggestions.length > 0) pick(suggestions[0]);
        }}
        placeholder="Type a country name…"
        disabled={disabled}
      />
      {suggestions.length > 0 && (
        <div className="gc-suggestions">
          {suggestions.map((id) => (
            <div key={id} className="gc-suggestion" onClick={() => pick(id)}>
              {countries[id].name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
