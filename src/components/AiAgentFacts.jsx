import countries from '../data/countries.js';
import countryFacts from '../data/countryFacts.js';
import { formatPopulation, formatGdp } from '../lib/format.js';

const MAX_LANGUAGES_SHOWN = 4;

export default function AiAgentFacts({ targetId }) {
  const facts = countryFacts[targetId];
  if (!facts) return null;

  const neighborNames = facts.neighbors.map((id) => countries[id]?.name).filter(Boolean);
  const shownLanguages = facts.languages.slice(0, MAX_LANGUAGES_SHOWN);
  const extraLanguages = facts.languages.length - shownLanguages.length;

  return (
    <div className="gc-agent">
      <div className="gc-agent-title">🤖 AI Agent briefing</div>
      <div className="gc-agent-fact">
        <span className="gc-agent-fact-label">Population</span>
        <span className="gc-agent-fact-value">{formatPopulation(facts.population)}</span>
      </div>
      <div className="gc-agent-fact">
        <span className="gc-agent-fact-label">GDP</span>
        <span className="gc-agent-fact-value">{formatGdp(facts.gdpUsd)}</span>
      </div>
      <div className="gc-agent-fact">
        <span className="gc-agent-fact-label">Language{shownLanguages.length === 1 ? '' : 's'}</span>
        <span className="gc-agent-fact-value">
          {shownLanguages.join(', ')}
          {extraLanguages > 0 ? ` +${extraLanguages} more` : ''}
        </span>
      </div>
      <div className="gc-agent-fact gc-agent-fact-neighbors">
        <span className="gc-agent-fact-label">Neighbors</span>
        {neighborNames.length > 0 ? (
          <div className="gc-agent-chips">
            {neighborNames.map((name) => (
              <span key={name} className="gc-agent-chip">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <span className="gc-agent-fact-value">None — it's an island nation</span>
        )}
      </div>
    </div>
  );
}
