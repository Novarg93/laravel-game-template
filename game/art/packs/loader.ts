import Phaser from 'phaser';
import { gameAssetUrl } from '../../assets';
import { packTextureKey } from './registry';
import type { PackManifest, PackTexture } from './types';
import { localPackPath } from './validation';

export function queuePackTextures(scene: Phaser.Scene, pack: PackManifest) {
    for (const texture of pack.textures) {
        const key = packTextureKey(pack, texture.id);
        if (texture.kind === 'primitive' || scene.textures.exists(key)) continue;
        const image = gameAssetUrl(localPackPath(texture.image, ['png']));
        if (texture.kind === 'atlas') scene.load.atlas(key, image, gameAssetUrl(localPackPath(texture.data, ['json'])));
        else if (texture.kind === 'sheet') scene.load.spritesheet(key, image, { frameWidth: texture.frameWidth, frameHeight: texture.frameHeight });
        else scene.load.image(key, image);
    }
}

function drawTexture(g: Phaser.GameObjects.Graphics, spec: Extract<PackTexture, { kind: 'primitive' }>) {
    const { width: w, height: h, color, accent, shape } = spec;
    g.fillStyle(color).lineStyle(1, accent, .8);
    switch (shape) {
        case 'tile':
            g.fillRect(0, 0, w, h).lineStyle(1, accent, .65)
                .lineBetween(0, 0, w, 0).lineBetween(0, 0, 0, h)
                .lineBetween(w / 2, 0, w / 2, h).lineBetween(0, h / 2, w, h / 2);
            g.fillStyle(accent, .45).fillRect(5, 5, 4, 2).fillRect(w - 9, h - 7, 4, 2);
            break;
        case 'round':
            g.fillEllipse(w / 2, h / 2, w - 2, h - 2).strokeEllipse(w / 2, h / 2, w - 2, h - 2)
                .fillStyle(accent).fillRect(w * .34, h * .33, w * .31, 2);
            break;
        case 'diamond':
            g.fillTriangle(w / 2, 0, 0, h / 2, w, h / 2).fillTriangle(w / 2, h, 0, h / 2, w, h / 2)
                .fillStyle(accent).fillCircle(w / 2, h / 2, Math.min(w, h) * .17);
            break;
        case 'triangle':
            g.fillTriangle(w - 1, h / 2, 1, 1, 1, h - 1).strokeTriangle(w - 1, h / 2, 1, 1, 1, h - 1)
                .fillStyle(accent).fillRect(w * .2, h * .4, 3, 2);
            break;
        case 'bolt':
            g.fillRoundedRect(0, h * .2, w, h * .6, 2).fillStyle(accent).fillRect(w * .35, h / 2 - 1, w * .6, 2);
            break;
        case 'robot':
            g.fillRoundedRect(1, 1, w - 2, h - 3, 4).strokeRoundedRect(1, 1, w - 2, h - 3, 4)
                .fillStyle(0x161c28).fillRect(w * .15, h * .28, w * .7, h * .22)
                .fillStyle(accent).fillRect(w * .3, h * .34, w * .4, Math.max(2, h * .08))
                .fillRect(w * .18, h * .78, w * .19, h * .19).fillRect(w * .63, h * .78, w * .19, h * .19);
            break;
    }
}

/** One pack per Phaser.Game. Textures survive scene/run restarts; Game.destroy owns final release. */
export function preparePackTextures(scene: Phaser.Scene, pack: PackManifest) {
    let bytes = 0;
    const keys: string[] = [];
    const created: string[] = [];
    const canvas = scene.make.graphics({ x: 0, y: 0 }, false);
    try {
        for (const texture of pack.textures) {
            const key = packTextureKey(pack, texture.id);
            if (texture.kind === 'primitive' && !scene.textures.exists(key)) {
                canvas.clear();
                drawTexture(canvas, texture);
                canvas.generateTexture(key, texture.width, texture.height);
                created.push(key);
            }
            if (!scene.textures.exists(key)) throw new Error(`Could not load texture ${texture.id}`);
            const loaded = scene.textures.get(key);
            const source = loaded.getSourceImage() as { width: number; height: number };
            if (source.width !== texture.width || source.height !== texture.height) {
                throw new Error(`Unexpected dimensions for ${texture.id}: ${source.width}×${source.height}`);
            }
            loaded.setFilter(Phaser.Textures.FilterMode.NEAREST);
            bytes += source.width * source.height * 4;
            keys.push(key);
        }
        for (const sprite of pack.sprites) for (const clip of Object.values(sprite.clips)) {
            if (!clip) continue;
            const texture = scene.textures.get(packTextureKey(pack, clip.texture));
            for (const frames of Object.values(clip.frames)) for (const frame of frames) {
                if (frame !== null && !texture.has(String(frame))) throw new Error(`Missing frame ${String(frame)} in ${clip.texture}`);
            }
        }
    } catch (error) {
        for (const key of created) scene.textures.remove(key);
        throw error;
    } finally {
        canvas.destroy();
    }
    return { keys, bytes };
}
