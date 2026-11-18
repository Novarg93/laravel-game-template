import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { loadProjectTs } from './lib/load-project-ts.mjs';

const project = fileURLToPath(new URL('..', import.meta.url));
const load = path => loadProjectTs(resolve(project, path));
const root = resolve(project, 'public/game-assets');
const { assetPacks } = load('game/art/packs/registry.ts');
const { permitsContent, validatePackCompatibility } = load('game/art/packs/validation.ts');
const { gameDefinitions } = load('game/content/registry.ts');
const { checkPackFiles, readAsset, pngDimensions, atlasFrames } = load('scripts/check-asset-pack-files.ts');
const { preloadGameArt } = load('game/art/packs/pixelSurvivor.ts');
const { audioSampleIds, audioSampleUrl } = load('game/audio/samples.ts');
const { MUSIC_TRACKS, musicTrackUrl } = load('game/audio/musicTracks.ts');

const stock = new Map();
const path = url => url.replace(/^\/game-assets\//, '');
const add = (key, image, atlas) => {
    if (stock.has(key)) throw new Error(`Duplicate stock texture key: ${key}`);
    stock.set(key, { image: path(image), atlas: atlas && path(atlas) });
};
preloadGameArt({ textures: { exists: () => false }, load: { image: add, atlas: add } });
for (const { image, atlas } of stock.values()) {
    const { width, height } = pngDimensions(readAsset(root, image, ['png']), image);
    if (atlas) atlasFrames(readAsset(root, atlas, ['json']), atlas, width, height);
}
for (const sample of audioSampleIds) readAsset(root, path(audioSampleUrl(sample)), ['wav', 'ogg', 'mp3']);
for (const track of Object.keys(MUSIC_TRACKS)) readAsset(root, path(musicTrackUrl(track)), ['mp3']);
for (const pack of assetPacks) {
    const supported = gameDefinitions.filter(game => permitsContent(pack, game));
    if (!supported.length || pack.compatible !== 'any' && (new Set(pack.compatible).size !== pack.compatible.length || supported.length !== pack.compatible.length)) {
        throw new Error(`Invalid compatible content IDs for ${pack.id}`);
    }
    for (const game of supported) validatePackCompatibility(pack, game);
    if (pack.renderer === 'manifest') checkPackFiles(pack, root);
}
globalThis.console.log(`Asset packs valid: ${assetPacks.map(pack => pack.id).join(', ')}. Verified ${stock.size} legacy texture keys.`);
