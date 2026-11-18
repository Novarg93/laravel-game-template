import { expect, it } from 'vitest';
import { World } from '../../game/systems/World';

// Current-tuning structural probe; does not replace the historical golden hashes.
function replay(seed: number, start: number) {
  const world = new World(seed);
  world.elapsed = start;
  world.player.invulnerableUntil = 1e6; // Survives the probe; not survival evidence.
  for (let frame = 0; frame < 200; frame++) {
    if (world.status === 'upgrade') world.selectUpgrade(world.choices[0].id);
    world.step(.05, { x: Math.cos(frame * .01), y: Math.sin(frame * .01) });
  }
  const { runId, ...snapshot } = world.snapshot();
  void runId;
  return JSON.stringify({ snapshot, player: world.player, enemies: world.enemies, projectiles: world.projectiles, impacts: world.impacts, nextRandom: world.rng.next() });
}
it.each([0, 180, 480, 570, 870])('replays current gameplay, entities and RNG deterministically from %ss', start => {
  expect(replay(12345, start)).toBe(replay(12345, start));
  expect(replay(12345, start)).not.toBe(replay(54321, start));
});
