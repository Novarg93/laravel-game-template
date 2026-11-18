import { ENEMIES } from '../../config/enemyDefinitions';
import { ABILITIES } from '../../abilities/definitions';
import type { AnimationClip, PackManifest, PackTexture, SpriteDefinition } from './types';

function shape(id: string, shape: Extract<PackTexture, { kind: 'primitive' }>['shape'], width: number, height: number, color: number, accent: number): PackTexture {
    return { id, kind: 'primitive', shape, width, height, color, accent };
}

function figure(id: string, texture: string, origin: SpriteDefinition['origin'] = [.5, .5]): SpriteDefinition {
    const idle: AnimationClip = { texture, fps: 1, loop: true, frames: { s: [null] } };
    return { id, origin, directions: 1, scale: 1, clips: { idle }, fallback: { walk: 'idle', attack: 'idle', cast: 'idle', hurt: 'idle', death: 'idle' } };
}

const textures = [
    shape('mage', 'robot', 22, 26, 0xa899ff, 0xe8e5ff),
    shape('warrior', 'robot', 26, 29, 0xf4ae54, 0xffdfae),
    shape('creep', 'round', 17, 17, 0x69a94d, 0xc3e48f),
    shape('runner', 'triangle', 17, 16, 0xf6a65c, 0xffe4a8),
    shape('tank', 'robot', 29, 30, 0x778eac, 0xd1e5ed),
    shape('caster', 'diamond', 21, 22, 0xb373be, 0xf7a5f2),
    shape('guardian', 'diamond', 32, 39, 0xc0a74b, 0xffe683),
    shape('miniboss', 'robot', 43, 43, 0xd17262, 0xffb28e),
    shape('warden', 'robot', 67, 73, 0x8e4259, 0xff997f),
    shape('spark', 'bolt', 17, 8, 0xffb75f, 0xfff5ab),
    shape('hostile', 'diamond', 11, 11, 0xe35284, 0xffbcd5),
    shape('xp', 'diamond', 6, 8, 0x64d9ed, 0xc5fafb),
    shape('healing', 'diamond', 12, 14, 0xff738a, 0xffd6dc),
    shape('haste', 'diamond', 12, 14, 0xf3ce6e, 0xffedb2),
    shape('fury', 'diamond', 12, 14, 0xe78a66, 0xffc09c),
    shape('magnet', 'diamond', 12, 14, 0x7cb6ff, 0xbbddff),
    shape('chest', 'robot', 22, 17, 0xa86756, 0xf5d784),
    shape('artifact', 'diamond', 15, 20, 0x8263bc, 0xf5d784),
    shape('ground', 'tile', 96, 96, 0x233838, 0x34504b),
];

const enemySprites: Record<string, string> = {
    grunt: 'creep', runner: 'runner', tank: 'tank', caster: 'caster',
    rusher: 'runner', splitter: 'creep', guardian: 'guardian',
    charger: 'miniboss', sorcerer: 'miniboss', eclipse: 'miniboss', ashGuard: 'warden',
};
const skillColors = [0xffb75f, 0x7fe6fe, 0xd8a3ff, 0xff975f, 0x76dbea, 0xffe8a1, 0xffcd7a, 0xfd927c, 0x9bbefc, 0xc6d2df];
const effects = ABILITIES.map((ability, index) => shape(ability.id + '-effect', 'diamond', 16, 16, skillColors[index], 0xffffff));
const feedback = [
    shape('hit', 'triangle', 12, 12, 0xfff0cd, 0xff985d),
    shape('death', 'diamond', 17, 17, 0xff876e, 0xffbe85),
    shape('area', 'diamond', 16, 16, 0xffac63, 0xffd28e),
    shape('danger', 'diamond', 16, 16, 0xff547e, 0xff90aa),
];

export const primitivePack: PackManifest = {
    id: 'primitive', version: 1, name: 'Primitive', compatible: ['pixel-survivor', 'training-grove'], developmentOnly: false, renderer: 'manifest',
    textures: [...textures, ...effects, ...feedback],
    sprites: [...textures.filter(texture => texture.id !== 'ground'), ...effects, ...feedback].map(texture => figure(texture.id, texture.id)),
    heroes: { mage: 'mage', warrior: 'warrior' },
    enemies: Object.fromEntries(Object.keys(ENEMIES).map(id => [id, enemySprites[id]])),
    skills: Object.fromEntries(ABILITIES.map(({ id }) => [id, { effect: id + '-effect', ...(id === 'fireball' || id === 'blades' ? { projectile: 'spark' } : {}) }])),
    projectiles: { player: 'spark', hostile: 'hostile' },
    pickups: { xp: 'xp', healing: 'healing', haste: 'haste', fury: 'fury', magnet: 'magnet', chest: 'chest', artifact: 'artifact' },
    terrain: { grove: { texture: 'ground', scale: 1 } },
    feedback: { hit: 'hit', death: 'death', area: 'area', danger: 'danger' },
    icons: {},
    audio: { inherit: false },
};

export const trainingReskin: PackManifest = {
    ...primitivePack,
    id: 'training-reskin', name: 'Training Foundry', developmentOnly: true, compatible: ['training-grove'],
    textures: [...primitivePack.textures,
        shape('scout', 'robot', 24, 30, 0x10c7b3, 0xaff8ed),
        shape('scout-walk', 'robot', 24, 29, 0x0a9aab, 0xaff8ed),
        shape('scout-hurt', 'robot', 24, 29, 0xe9816e, 0xffdcbe),
        shape('scout-death', 'robot', 28, 15, 0x465674, 0x98afbd),
        shape('bramble', 'triangle', 21, 17, 0xcc70ea, 0xf2c6ff),
        shape('trail-beam', 'bolt', 25, 6, 0x1deef3, 0xc7ffff),
        shape('trail-burst', 'diamond', 20, 20, 0x5ccfee, 0xd4ffff),
        shape('foundry', 'tile', 112, 112, 0x222936, 0x344356),
        { id: 'salvage-xp', kind: 'atlas', image: 'hd/loot.png', data: 'hd/loot.json', width: 480, height: 408 },
        { id: 'salvage-crate', kind: 'sheet', image: 'hd/war-banner-v1/object.png', width: 160, height: 160, frameWidth: 160, frameHeight: 160 },
    ],
    sprites: [...primitivePack.sprites,
        {
            ...figure('scout', 'scout', [.5, .66]),
            clips: {
                idle: { texture: 'scout', fps: 1, loop: true, frames: { s: [null] } },
                walk: { texture: 'scout-walk', fps: 8, loop: true, frames: { s: [null] } },
                hurt: { texture: 'scout-hurt', fps: 8, loop: false, frames: { s: [null] } },
                death: { texture: 'scout-death', fps: 8, loop: false, frames: { s: [null] } },
            },
        },
        figure('bramble', 'bramble'), figure('trail-beam', 'trail-beam'), figure('trail-burst', 'trail-burst'),
        { ...figure('salvage-xp', 'salvage-xp'), scale: .32, clips: { idle: { texture: 'salvage-xp', fps: 6, loop: true, frames: { s: ['xp-idle-0', 'xp-idle-1', 'xp-idle-2'] } } } },
        { ...figure('salvage-crate', 'salvage-crate'), scale: .15, clips: { idle: { texture: 'salvage-crate', fps: 1, loop: true, frames: { s: [0] } } } },
    ],
    heroes: { ...primitivePack.heroes, scout: 'scout' },
    enemies: { ...primitivePack.enemies, bramble: 'bramble' },
    skills: { ...primitivePack.skills, 'trail-spark': { effect: 'trail-burst', projectile: 'trail-beam' } },
    terrain: { 'trial-grove': { texture: 'foundry', scale: 1 }, ...primitivePack.terrain },
    pickups: { ...primitivePack.pickups, xp: 'salvage-xp', chest: 'salvage-crate' },
    icons: { heroes: { scout: '▣' }, skills: { 'trail-spark': '⟫' } },
    audio: { inherit: false, events: { 'ui.start': { file: 'audio/mage-sfx-v1/mage-blink.wav', gain: .5 } } },
};
