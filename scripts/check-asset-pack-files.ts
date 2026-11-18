import { readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import type { PackManifest } from '../game/art/packs/types';
import { localPackPath } from '../game/art/packs/validation';

export function readAsset(root: string, path: string, extensions: readonly string[]) {
    localPackPath(path, extensions);
    const base = realpathSync(root);
    let absolute: string;
    try { absolute = realpathSync(resolve(base, path)); }
    catch { throw new Error(`Missing asset file: ${path}`); }
    const location = relative(base, absolute);
    if (location.startsWith('..') || isAbsolute(location) || !statSync(absolute).isFile()) {
        throw new Error(`Asset is outside the public game file tree: ${path}`);
    }
    return readFileSync(absolute);
}

export function pngDimensions(data: Buffer, name: string) {
    const signature = '89504e470d0a1a0a';
    if (data.length < 33 || data.subarray(0, 8).toString('hex') !== signature || data.toString('ascii', 12, 16) !== 'IHDR') {
        throw new Error(`Invalid PNG: ${name}`);
    }
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    if (!width || !height) throw new Error(`Empty PNG dimensions: ${name}`);
    return { width, height };
}

function object(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function atlasFrames(bytes: Buffer, path: string, width: number, height: number) {
    let raw: unknown;
    try { raw = JSON.parse(bytes.toString()); }
    catch { throw new Error(`Invalid atlas JSON: ${path}`); }
    if (!object(raw)) throw new Error(`Invalid atlas: ${path}`);
    const table = raw.frames;
    const rows: [unknown, unknown][] = Array.isArray(table)
        ? table.map((row: unknown) => [object(row) ? row.filename : null, row])
        : object(table) ? Object.entries(table) : [];
    if (!rows.length) throw new Error(`No atlas frames: ${path}`);
    const names = new Set<string>();
    for (const [name, entry] of rows) {
        const frame = object(entry) && entry.frame;
        if (typeof name !== 'string' || !name || names.has(name) || !object(frame)) throw new Error(`Invalid or duplicate atlas frame: ${path}`);
        const { x, y, w, h } = frame;
        if (typeof x !== 'number' || typeof y !== 'number' || typeof w !== 'number' || typeof h !== 'number'
            || ![x, y, w, h].every(Number.isInteger) || x < 0 || y < 0 || w < 1 || h < 1 || x + w > width || y + h > height) {
            throw new Error(`Atlas frame outside texture: ${path} / ${name}`);
        }
        names.add(name);
    }
    return names;
}

export function checkPackFiles(pack: PackManifest, root: string) {
    const atlases = new Map<string, ReadonlySet<string>>();
    for (const texture of pack.textures) {
        if (texture.kind === 'primitive') continue;
        const { width, height } = pngDimensions(readAsset(root, texture.image, ['png']), texture.image);
        if (width !== texture.width || height !== texture.height) throw new Error(`Unexpected dimensions for ${texture.image}`);
        if (texture.kind === 'atlas') {
            atlases.set(texture.id, atlasFrames(readAsset(root, texture.data, ['json']), texture.data, width, height));
        }
    }
    for (const sprite of pack.sprites) for (const [name, clip] of Object.entries(sprite.clips)) {
        const keys = clip && atlases.get(clip.texture);
        if (keys && clip) for (const frames of Object.values(clip.frames)) for (const frame of frames) {
            if (typeof frame !== 'string' || !keys.has(frame)) throw new Error(`Missing atlas frame ${String(frame)} in ${sprite.id}/${name}`);
        }
    }
    for (const group of [pack.audio.events, pack.audio.loops, pack.audio.music]) {
        for (const sample of Object.values(group ?? {})) readAsset(root, sample.file, ['wav', 'ogg', 'mp3']);
    }
}
