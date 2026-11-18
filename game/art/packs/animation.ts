import { DIRECTIONS, type AnimationClip, type ClipName, type Direction, type Frame, type SpriteDefinition } from './types';

export const directionSlots: Record<SpriteDefinition['directions'], readonly Direction[]> = {
    1: ['s'], 4: ['s', 'w', 'n', 'e'], 8: DIRECTIONS,
};

export function facingDirection(x: number, y: number, previous: Direction = 's'): Direction {
    if (x === 0 && y === 0) return previous;
    const index = Math.round(Math.atan2(-x, y) / (Math.PI / 4));
    return DIRECTIONS[(index + 8) % 8];
}

export function spriteClip(sprite: SpriteDefinition, requested: ClipName): AnimationClip {
    const next = sprite.fallback?.[requested];
    return sprite.clips[requested] ?? (next ? spriteClip(sprite, next) : sprite.clips.idle);
}

export function animationFrame(sprite: SpriteDefinition, clip: AnimationClip, direction: Direction, age: number) {
    const index = DIRECTIONS.indexOf(direction);
    const slot = sprite.directions === 1 ? 's' : sprite.directions === 4 ? DIRECTIONS[Math.round(index / 2) * 2 % 8] : direction;
    const source = sprite.mirror?.[slot] ?? slot;
    const frames = clip.frames[source]!;
    const frame = Math.floor(Math.max(0, age) * clip.fps);
    return { frame: frames[clip.loop ? frame % frames.length : Math.min(frame, frames.length - 1)] as Frame, flipX: source !== slot };
}
