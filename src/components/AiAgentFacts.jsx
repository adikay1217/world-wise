import countries from '../data/countries.js';
import countryFacts from '../data/countryFacts.js';
import countryFunFacts from '../data/countryFunFacts.js';
import { formatPopulation, formatGdp } from '../lib/format.js';

const MAX_LANGUAGES_SHOWN = 4;
const STAGGER_MS = 110;

export default function AiAgentFacts({ targetId }) {
  const facts = countryFacts[targetId];
  const name = countries[targetId]?.name;
  if (!facts || !name) return null;

  const neighborNames = facts.neighbors.map((id) => countries[id]?.name).filter(Boolean);
  const shownLanguages = facts.languages.slice(0, MAX_LANGUAGES_SHOWN);
  const extraLanguages = facts.languages.length - shownLanguages.length;

  return (
    <div className="gc-agent">
      <div className="gc-agent-title">Facts about {name}</div>
      <div className="gc-agent-fact" style={{ animationDelay: `${STAGGER_MS}ms` }}>
        <span className="gc-agent-fact-label">Population</span>
        <span className="gc-agent-fact-value">{formatPopulation(facts.population)}</span>
      </div>
      <div className="gc-agent-fact" style={{ animationDelay: `${STAGGER_MS * 2}ms` }}>
        <span className="gc-agent-fact-label">GDP</span>
        <span className="gc-agent-fact-value">{formatGdp(facts.gdpUsd)}</span>
      </div>
      <div className="gc-agent-fact" style={{ animationDelay: `${STAGGER_MS * 3}ms` }}>
        <span className="gc-agent-fact-label">Language{shownLanguages.length === 1 ? '' : 's'}</span>
        <span className="gc-agent-fact-value">
          {shownLanguages.join(', ')}
          {extraLanguages > 0 ? ` +${extraLanguages} more` : ''}
        </span>
      </div>
      <div className="gc-agent-fact gc-agent-fact-neighbors" style={{ animationDelay: `${STAGGER_MS * 4}ms` }}>
        <span className="gc-agent-fact-label">Neighbors</span>
        {neighborNames.length > 0 ? (
          <div className="gc-agent-chips">
            {neighborNames.map((n) => (
              <span key={n} className="gc-agent-chip">
                {n}
              </span>
            ))}
          </div>
        ) : (
          <span className="gc-agent-fact-value">None — it's an island nation</span>
        )}
      </div>
      {countryFunFacts[targetId] && (
        <div className="gc-agent-fact gc-agent-fact-fun" style={{ animationDelay: `${STAGGER_MS * 5}ms` }}>
          <span className="gc-agent-fact-label">Did you know?</span>
          <span className="gc-agent-fact-value">{countryFunFacts[targetId]}</span>
        </div>
      )}
    </div>
  );
}
