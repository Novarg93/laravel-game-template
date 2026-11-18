import { readdirSync } from 'node:fs';

/** Filename aliases only. Approved bytes and historical proof contents stay unchanged. */
export function runtimePath(file) {
  if (file === 'public/favicon.svg') return 'game/favicon.svg';
  return file.replace(/^public\/assets\//, 'public/game-assets/').replace(/^src\/game\//, 'game/').replace(/^src\/ui\//, 'game/ui/').replace(/^src\//, 'game/');
}
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}
/** The original game-only inventory, expressed in its authored logical filenames. */
export function historicalWalk(directory) {
  if (directory === 'src') return walk('game').filter(file => !['game/assets.ts', 'game/favicon.svg'].includes(file)).map(file => {
    const relative = file.slice('game/'.length);
    return /^(?:ui\/|App\.vue$|main\.ts$|env\.d\.ts$|style\.css$)/.test(relative) ? `src/${relative}` : `src/game/${relative}`;
  });
  if (directory === 'public') return [...walk('public/game-assets').map(file => file.replace(/^public\/game-assets\//, 'public/assets/')), 'public/favicon.svg'];
  return walk(directory);
}
