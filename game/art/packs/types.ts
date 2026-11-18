import type { AssetId, SoundEvent } from '../../audio/catalog';
import type { AudioSampleId } from '../../audio/samples';
import type { MusicTrackId } from '../../audio/musicTracks';
import type { LootKind } from '../../loot/types';

export const DIRECTIONS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'] as const;
export type Direction = typeof DIRECTIONS[number];
export type Frame = string | number | null;
export type ClipName = 'idle' | 'walk' | 'run' | 'attack' | 'cast' | 'hurt' | 'death' | `custom-${string}`;

interface TextureSize { id: string; width: number; height: number }
export type PackTexture = TextureSize & (
    | { kind: 'primitive'; shape: 'round' | 'diamond' | 'robot' | 'triangle' | 'bolt' | 'tile'; color: number; accent: number }
    | { kind: 'image'; image: string }
    | { kind: 'sheet'; image: string; frameWidth: number; frameHeight: number }
    | { kind: 'atlas'; image: string; data: string }
);

export interface AnimationClip {
    texture: string;
    fps: number;
    loop: boolean;
    frames: Partial<Record<Direction, readonly Frame[]>>;
}

export interface SpriteDefinition {
    id: string;
    origin: readonly [number, number];
    scale: number;
    directions: 1 | 4 | 8;
    mirror?: Partial<Record<Direction, Direction>>;
    clips: Partial<Record<ClipName, AnimationClip>> & { idle: AnimationClip };
    fallback?: Partial<Record<ClipName, ClipName>>;
}

export interface AudioFile { file: string; gain: number }
export interface PackAudio {
    inherit: boolean;
    events?: Partial<Record<SoundEvent, AudioFile>>;
    loops?: Partial<Record<AssetId | AudioSampleId, AudioFile>>;
    music?: Partial<Record<MusicTrackId, AudioFile>>;
}

export interface PackIcons {
    heroes?: Readonly<Record<string, string>>;
    skills?: Readonly<Record<string, string>>;
    buffs?: Partial<Record<'haste' | 'fury', string>>;
}

interface PackIdentity {
    id: string;
    version: number;
    name: string;
    developmentOnly: boolean;
    compatible: 'any' | readonly string[];
}

export interface LegacyPack extends PackIdentity { renderer: 'pixel-survivor' }

export interface PackManifest extends PackIdentity {
    renderer: 'manifest';
    textures: readonly PackTexture[];
    sprites: readonly SpriteDefinition[];
    heroes: Readonly<Record<string, string>>;
    enemies: Readonly<Record<string, string>>;
    /** Behavior-independent content IDs or their logical visual references. */
    skills: Readonly<Record<string, { projectile?: string; effect: string }>>;
    projectiles: { player: string; hostile: string };
    terrain: Readonly<Record<string, { texture: string; scale: number }>>;
    pickups: Readonly<Record<LootKind | 'xp' | 'chest' | 'artifact', string>>;
    feedback: { hit: string; death: string; area: string; danger: string };
    icons: PackIcons;
    audio: PackAudio;
}

export type AssetPackDefinition = LegacyPack | PackManifest;
