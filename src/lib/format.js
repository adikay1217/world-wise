export function formatPopulation(n) {
  if (n == null) return 'Unknown';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} billion`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} million`;
  return n.toLocaleString();
}

export function formatGdp(n) {
  if (n == null) return 'Not publicly reported';
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)} trillion`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)} billion`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)} million`;
  return `$${n.toLocaleString()}`;
}
