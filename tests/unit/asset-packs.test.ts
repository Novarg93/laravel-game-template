import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkPackFiles, atlasFrames, readAsset } from '../../scripts/check-asset-pack-files';
import { animationFrame, facingDirection, spriteClip } from '../../game/art/packs/animation';
import { primitivePack, trainingReskin } from '../../game/art/packs/primitive';
import { assetPacks, packTextureKey, selectAssetPack } from '../../game/art/packs/registry';
import type { PackManifest, SpriteDefinition } from '../../game/art/packs/types';
import { binding, localPackPath, validatePack, validatePackCompatibility } from '../../game/art/packs/validation';
import { contentFingerprintInput } from '../../game/content/definitionFingerprint';
import { gameDefinition } from '../../game/content/registry';
import { validateGameDefinition } from '../../game/content/validation';

const root = resolve('public/game-assets');

describe('asset pack validation', () => {
    const sprite = trainingReskin.sprites[0];
    const replace = (replacement: SpriteDefinition): PackManifest => ({ ...trainingReskin, sprites: [replacement, ...trainingReskin.sprites.slice(1)] });

    it('validates registered packs and their shipped files', () => {
        for (const pack of assetPacks) expect(() => validatePack(pack)).not.toThrow();
        expect(() => checkPackFiles(trainingReskin, root)).not.toThrow();
        expect(packTextureKey(trainingReskin, 'scout')).toBe('pack:training-reskin:v1:scout');
    });

    it('rejects duplicate IDs, unavailable textures, invalid pivots and invalid scales', () => {
        expect(() => validatePack({ ...trainingReskin, textures: [trainingReskin.textures[0], ...trainingReskin.textures] })).toThrow('duplicate texture');
        expect(() => validatePack(replace({ ...sprite, clips: { idle: { ...sprite.clips.idle, texture: 'no-such-texture' } } }))).toThrow('Missing texture');
        expect(() => validatePack(replace({ ...sprite, origin: [.5, -1] }))).toThrow('Invalid origin');
        expect(() => validatePack(replace({ ...sprite, scale: 0 }))).toThrow('Invalid origin');
    });

    it('rejects an unsupported state, direction, missing movement clip and missing named atlas frames', () => {
        const unsupported = { ...sprite, clips: { ...sprite.clips, dancing: sprite.clips.idle } };
        expect(() => validatePack(replace(unsupported))).toThrow('Unsupported animation state');
        expect(() => validatePack(replace({ ...sprite, clips: { idle: { ...sprite.clips.idle, frames: { n: [null] } } } }))).toThrow('Unsupported direction');
        expect(() => validatePack(replace({ ...sprite, fallback: {} }))).toThrow('Missing movement clip');
        const pack = { ...trainingReskin, sprites: trainingReskin.sprites.map(sprite => sprite.id === 'salvage-xp'
            ? { ...sprite, clips: { idle: { ...sprite.clips.idle, frames: { s: ['absent-frame'] } } } } : sprite) };
        expect(() => checkPackFiles(pack, root)).toThrow('Missing atlas frame absent-frame');
        expect(() => atlasFrames(Buffer.from('{"frames": '), 'bad.json', 64, 64)).toThrow('Invalid atlas JSON');
    });

    it('constrains file paths, extensions and real paths and reports missing files', () => {
        for (const path of ['../art.png', '/assets/a.png', 'https://example.com/a.png', 'a/%2e%2e/a.png', 'a.png?foo=bar', 'a.gif', 'a\\b.png']) {
            expect(() => localPackPath(path, ['png'])).toThrow('Invalid local asset path');
        }
        expect(() => readAsset(root, 'packs/missing/example.png', ['png'])).toThrow('Missing asset file');
    });

    it('matches content IDs before logical hints and requires compatible, explicitly selected packs', () => {
        const training = gameDefinition('training-grove');
        expect(binding(trainingReskin.enemies, 'bramble', 'runner')).toBe('bramble');
        expect(binding(trainingReskin.skills, 'trail-spark', 'fireball')?.projectile).toBe('trail-beam');
        expect(selectAssetPack(training, 'training-reskin', true)).toBe(trainingReskin);
        expect(() => selectAssetPack(training, 'training-reskin')).toThrow('unavailable');
        expect(() => selectAssetPack(gameDefinition(), 'training-reskin', true)).toThrow('does not support');
        const missing = { ...training, heroes: [{ ...training.heroes[0], visual: 'no-such-visual' }] };
        expect(() => validateGameDefinition(missing)).not.toThrow();
        expect(() => validatePackCompatibility(primitivePack, missing)).toThrow('Unknown hero visual');
    });
});

describe('manifest animation selection', () => {
    const base = { ...primitivePack.sprites[0], directions: 4, mirror: { w: 'e' },
        clips: {
            idle: { texture: 'actor', fps: 4, loop: true, frames: { n: ['n1'], e: ['e1', 'e2', 'e3'], s: ['s1'] } },
            hurt: { texture: 'actor', fps: 8, loop: false, frames: { n: ['hurt-n'], e: ['hurt-e'], s: ['hurt-s'] } },
        }, fallback: { attack: 'hurt' } } satisfies SpriteDefinition;

    it('resolves directional layouts, explicit mirrors, different frame counts and optional fallbacks', () => {
        expect(facingDirection(1, -1)).toBe('ne');
        expect(animationFrame(base, spriteClip(base, 'idle'), 'w', .25)).toEqual({ frame: 'e2', flipX: true });
        expect(animationFrame(base, spriteClip(base, 'idle'), 'e', .75)).toEqual({ frame: 'e1', flipX: false });
        expect(animationFrame(base, spriteClip(base, 'idle'), 'n', 4)).toEqual({ frame: 'n1', flipX: false });
        expect(animationFrame(base, spriteClip(base, 'attack'), 'e', 4).frame).toBe('hurt-e');
        expect(spriteClip(base, 'death')).toBe(base.clips.idle);
        const single = primitivePack.sprites[0];
        expect(animationFrame(single, single.clips.idle, 'sw', 1).frame).toBeNull();
        const eight: SpriteDefinition = { ...base, directions: 8, mirror: {}, clips: { idle: { ...base.clips.idle, frames: { ne: ['facing-ne'] } } } };
        expect(animationFrame(eight, eight.clips.idle, 'ne', 0).frame).toBe('facing-ne');
    });

    it('keeps artwork references out of new rules fingerprints and freezes published v1 inputs', () => {
        const legacy = gameDefinition('training-grove');
        expect(contentFingerprintInput(legacy)).toBe(legacy);
        const future = { ...legacy, version: 'training-grove-v2' };
        const reskin = { ...future, heroes: future.heroes.map(hero => ({ ...hero, visual: 'new-soldier' })),
            maps: future.maps.map(map => ({ ...map, presentation: { ...map.presentation, artPack: 'foundry' } })) };
        expect(contentFingerprintInput(future)).toEqual(contentFingerprintInput(reskin));
        expect(contentFingerprintInput({ ...future, heroes: future.heroes.map(hero => ({ ...hero, hp: 999 })) })).not.toEqual(contentFingerprintInput(future));
    });
});
