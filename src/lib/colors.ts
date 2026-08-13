/** Deterministic djb2-style hash so the same sender id always maps to the same color. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Colors are derived from the id itself (not creation order), so a sender's
 * color stays stable even as other senders join/leave around it. The golden
 * angle (137.508°) spaces hues evenly so adjacent ids rarely collide visually.
 */
export function colorForId(id: string): string {
  const hue = (hashString(id) * 137.508) % 360;
  return `hsl(${hue.toFixed(0)}, 65%, 50%)`;
}
