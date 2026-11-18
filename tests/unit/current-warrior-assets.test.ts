import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { rgbaPng } from '../helpers/rgbaPng';
import hero from '../../game/art/warriorHeroManifest.json';
import skills from '../../game/art/warriorSkillsManifest.json';
import ultimates from '../../game/art/warriorUltimatesManifest.json';

type Rect = { x: number; y: number; w: number; h: number };
const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
function atlas(directory: string, page: number, hash: string) {
  const file = `${directory}/${page}.png`;
  expect(sha(readFileSync(file)), file).toBe(hash);
  const image = rgbaPng(file);
  const data = JSON.parse(readFileSync(`${directory}/${page}.json`, 'utf8')) as { frames: Record<string, { frame: Rect }> };
  return { image, frames: data.frames };
}
function frameHash(page: ReturnType<typeof atlas>, name: string, expected: string) {
  const r = page.frames[name].frame;
  expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
  expect(r.x + r.w).toBeLessThanOrEqual(page.image.width);
  expect(r.y + r.h).toBeLessThanOrEqual(page.image.height);
  const pixels = Buffer.alloc(r.w * r.h * 4);
  for (let y = 0; y < r.h; y++) page.image.pixels.copy(pixels, y * r.w * 4, ((r.y + y) * page.image.width + r.x) * 4, ((r.y + y) * page.image.width + r.x + r.w) * 4);
  expect(sha(pixels), name).toBe(expected);
}
it('matches all 127 currently shipped hero frames to existing accepted manifest pixel hashes', () => {
  const pages = hero.pages.map(page => atlas('public/game-assets/hd/warrior-hero-v1', page.index, page.sha256));
  expect(Object.keys(hero.locations)).toHaveLength(127);
  for (const [name, location] of Object.entries(hero.locations)) frameHash(pages[location.page], name, location.pixelSHA256);
});
it('matches all 156 skill frames and two crack frames to existing accepted manifest pixel hashes', () => {
  const pages = skills.pages.map(page => atlas('public/game-assets/hd/warrior-skills-v1', page.index, page.sha256));
  expect(Object.keys(skills.locations)).toHaveLength(158);
  expect(Object.values(skills.clips).reduce((count, clip) => count + clip.frames.length, 0)).toBe(156);
  for (const [name, location] of Object.entries(skills.locations)) frameHash(pages[location.page], name, location.pixelSHA256);
});
it('matches all 63 currently shipped ultimate frames to existing accepted manifest pixel hashes', () => {
  const page = atlas('public/game-assets/hd/warrior-ultimates-v1', 0, ultimates.atlasSHA256);
  expect(Object.keys(ultimates.locations)).toHaveLength(63);
  for (const [name, location] of Object.entries(ultimates.locations)) frameHash(page, name, location.pixelSHA256);
});
