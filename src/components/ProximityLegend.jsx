export default function ProximityLegend() {
  return (
    <div className="gc-legend">
      <span className="gc-legend-label">FAR</span>
      <div className="gc-legend-gradient" />
      <span className="gc-legend-label">CLOSE</span>
      <div className="gc-legend-divider" />
      <div className="gc-legend-found">
        <span className="gc-legend-found-swatch" />
        FOUND
      </div>
    </div>
  );
}
