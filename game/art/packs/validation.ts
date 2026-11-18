import { ABILITIES } from '../../abilities/definitions';
import { PATCHES, SOUND_CATALOG } from '../../audio/catalog';
import { MUSIC_TRACKS } from '../../audio/musicTracks';
import { audioSampleIds } from '../../audio/samples';
import { ENEMIES } from '../../config/enemyDefinitions';
import type { GameDefinition } from '../../content/types';
import { LOOT_NAMES } from '../../loot/types';
import { directionSlots } from './animation';
import type { AssetPackDefinition, Direction, PackManifest, PackTexture, SpriteDefinition } from './types';

const idPattern = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
const supportedClips = /^(?:idle|walk|run|attack|cast|hurt|death|custom-[a-z][a-z0-9-]*)$/;
const mirrorOf: Partial<Record<Direction, Direction>> = { w: 'e', e: 'w', nw: 'ne', ne: 'nw', sw: 'se', se: 'sw' };
const size = (value: number) => Number.isInteger(value) && value > 0 && value <= 4096;
const range = (value: number, low: number, high: number) => Number.isFinite(value) && value >= low && value <= high;

function requireAsset(ok: unknown, message: string): asserts ok {
    if (!ok) throw new Error(message);
}

export function localPackPath(file: string, allowed: readonly string[]) {
    const ext = file.split('.').at(-1)?.toLowerCase() ?? '';
    requireAsset(/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.[a-zA-Z0-9]+$/.test(file) && allowed.includes(ext), `Invalid local asset path: ${file}`);
    return file;
}

export function assetIndex<T extends { id: string }>(rows: readonly T[], group: string) {
    const index = new Map<string, T>();
    for (const row of rows) {
        requireAsset(idPattern.test(row.id) && !index.has(row.id), `Invalid or duplicate ${group} ID: ${row.id}`);
        index.set(row.id, row);
    }
    return index;
}

export function binding<T>(table: Readonly<Record<string, T>>, id: string, visual: string): T | undefined {
    return Object.hasOwn(table, id) ? table[id] : Object.hasOwn(table, visual) ? table[visual] : undefined;
}

export function permitsContent(pack: AssetPackDefinition, content: GameDefinition) {
    return pack.compatible === 'any' || pack.compatible.includes(content.id);
}

export function validatePackCompatibility(pack: AssetPackDefinition, content: GameDefinition) {
    requireAsset(permitsContent(pack, content), `Asset pack ${pack.id} does not support ${content.id}`);
    const legacy = pack.renderer === 'pixel-survivor';
    for (const hero of content.heroes) {
        requireAsset(legacy ? ['mage', 'warrior'].includes(hero.visual) : binding(pack.heroes, hero.id, hero.visual), `Unknown hero visual ${hero.visual} for ${hero.id} in ${pack.id}`);
    }
    for (const enemy of content.enemies) {
        requireAsset(legacy ? Object.hasOwn(ENEMIES, enemy.visual) : binding(pack.enemies, enemy.id, enemy.visual), `Unknown enemy visual ${enemy.visual} for ${enemy.id} in ${pack.id}`);
    }
    for (const skill of content.skills) {
        requireAsset(legacy ? ABILITIES.some(a => a.id === skill.visual) : binding(pack.skills, skill.id, skill.visual), `Unknown skill visual ${skill.visual} for ${skill.id} in ${pack.id}`);
    }
    for (const map of content.maps) {
        requireAsset(legacy ? map.presentation.artPack === 'grove' : binding(pack.terrain, map.id, map.presentation.artPack), `Unknown terrain visual for ${map.id} in ${pack.id}`);
    }
}

function validateTexture(texture: PackTexture) {
    requireAsset(size(texture.width) && size(texture.height), `Invalid dimensions for ${texture.id}`);
    if (texture.kind === 'primitive') {
        requireAsset(['round', 'diamond', 'robot', 'triangle', 'bolt', 'tile'].includes(texture.shape)
            && [texture.color, texture.accent].every(value => Number.isInteger(value) && range(value, 0, 0xffffff)), `Invalid primitive ${texture.id}`);
        return;
    }
    localPackPath(texture.image, ['png']);
    if (texture.kind === 'atlas') localPackPath(texture.data, ['json']);
    if (texture.kind === 'sheet') {
        requireAsset(size(texture.frameWidth) && size(texture.frameHeight) && texture.width % texture.frameWidth === 0
            && texture.height % texture.frameHeight === 0, `Invalid sheet frame dimensions for ${texture.id}`);
    }
}

function validateSprite(sprite: SpriteDefinition, textures: Map<string, PackTexture>) {
    requireAsset(sprite.origin.length === 2 && sprite.origin.every(value => range(value, 0, 1)) && range(sprite.scale, .01, 16), `Invalid origin or scale for ${sprite.id}`);
    const slots = directionSlots[sprite.directions];
    requireAsset(slots && sprite.clips.idle, `Missing idle clip or unsupported direction layout for ${sprite.id}`);
    for (const [to, from] of Object.entries(sprite.mirror ?? {})) {
        requireAsset(slots.some(slot => slot === to) && from && slots.includes(from)
            && mirrorOf[from] === to && !sprite.mirror?.[from], `Unsupported direction mirror for ${sprite.id}: ${to}`);
    }
    for (const [name, clip] of Object.entries(sprite.clips)) {
        requireAsset(supportedClips.test(name) && clip, `Unsupported animation state ${name} in ${sprite.id}`);
        const texture = textures.get(clip.texture);
        requireAsset(texture, `Missing texture ${clip.texture} in ${sprite.id}/${name}`);
        requireAsset(range(clip.fps, 1, 120) && typeof clip.loop === 'boolean', `Invalid playback for ${sprite.id}/${name}`);
        const required = slots.filter(slot => !sprite.mirror?.[slot]);
        requireAsset(Object.keys(clip.frames).every(dir => required.some(slot => slot === dir)), `Unsupported direction in ${sprite.id}/${name}`);
        for (const dir of required) {
            const frames = clip.frames[dir];
            requireAsset(frames?.length && frames.length <= 1024, `Missing frames for ${sprite.id}/${name}/${dir}`);
            for (const frame of frames) {
                requireAsset(texture.kind === 'atlas' ? typeof frame === 'string' && frame.length > 0
                    : texture.kind === 'sheet' ? typeof frame === 'number' && Number.isInteger(frame) && frame >= 0
                        && frame < texture.width / texture.frameWidth * (texture.height / texture.frameHeight)
                        : frame === null, `Invalid frame ${String(frame)} in ${sprite.id}/${name}`);
            }
        }
    }
    for (const [name, target] of Object.entries(sprite.fallback ?? {})) {
        requireAsset(supportedClips.test(name) && target && target !== name && sprite.clips[target], `Invalid animation fallback ${name} in ${sprite.id}`);
    }
}

function validateAudio(pack: PackManifest) {
    const samples = new Set([...Object.keys(PATCHES), 'grove', 'forest', 'underscore', ...audioSampleIds]);
    for (const [id, audio] of Object.entries(pack.audio.events ?? {})) {
        requireAsset(Object.hasOwn(SOUND_CATALOG, id), `Unknown audio event ${id}`);
        requireAsset(range(audio.gain, 0, 4), `Invalid audio gain ${id}`);
        localPackPath(audio.file, ['wav', 'ogg', 'mp3']);
    }
    for (const [group, files] of [[samples, pack.audio.loops], [new Set(Object.keys(MUSIC_TRACKS)), pack.audio.music]] as const) {
        for (const [id, audio] of Object.entries(files ?? {})) {
            requireAsset(group.has(id) && range(audio.gain, 0, 4), `Invalid audio track ${id}`);
            localPackPath(audio.file, ['wav', 'ogg', 'mp3']);
        }
    }
}

export function validatePack(pack: AssetPackDefinition) {
    requireAsset(idPattern.test(pack.id) && Number.isInteger(pack.version) && pack.version > 0 && pack.name.trim(), `Invalid asset pack identity: ${pack.id}`);
    if (pack.renderer === 'pixel-survivor') return;
    const textures = assetIndex(pack.textures, 'texture');
    const sprites = assetIndex(pack.sprites, 'sprite');
    for (const texture of textures.values()) validateTexture(texture);
    for (const sprite of sprites.values()) validateSprite(sprite, textures);
    const allSprites = [...Object.values(pack.heroes), ...Object.values(pack.enemies), ...Object.values(pack.projectiles),
        ...Object.values(pack.pickups), ...Object.values(pack.feedback), ...Object.values(pack.skills).flatMap(skill => skill.projectile ? [skill.projectile, skill.effect] : [skill.effect])];
    for (const id of allSprites) requireAsset(sprites.has(id), `Unknown sprite ${id} in ${pack.id}`);
    for (const item of [...Object.keys(LOOT_NAMES), 'xp', 'chest', 'artifact']) requireAsset(Object.hasOwn(pack.pickups, item), `Missing pickup ${item} in ${pack.id}`);
    for (const id of [...Object.values(pack.heroes), ...Object.values(pack.enemies)]) {
        const sprite = sprites.get(id)!;
        requireAsset(sprite.clips.walk || sprite.clips.run || sprite.fallback?.walk, `Missing movement clip or explicit fallback for ${id}`);
    }
    for (const [id, terrain] of Object.entries(pack.terrain)) {
        const texture = textures.get(terrain.texture);
        requireAsset(texture && ['primitive', 'image'].includes(texture.kind) && range(terrain.scale, .1, 8), `Invalid terrain texture for ${id}`);
    }
    validateAudio(pack);
}
