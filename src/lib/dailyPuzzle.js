export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function hashString(s) {
  let hash = 0;
  for (const ch of s) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash;
}

export function pickTarget(ids, dateKey) {
  return ids[hashString(dateKey) % ids.length];
}

export function pickRandomTarget(ids, excludeId) {
  let id = ids[Math.floor(Math.random() * ids.length)];
  while (id === excludeId && ids.length > 1) {
    id = ids[Math.floor(Math.random() * ids.length)];
  }
  return id;
}

export function puzzleNumber(dateKey) {
  return Math.floor(new Date(dateKey).getTime() / 86400000) % 1000;
}

export function msUntilNextUtcMidnight(now = new Date()) {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.max(0, next - now);
}
