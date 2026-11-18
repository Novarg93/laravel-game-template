import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { historicalWalk } from '../../helpers/runtimePath';
import { readRuntimeFile } from '../../helpers/runtimeFile';
import { integrationProof } from '../helpers/integrationProof';

it('keeps an unavailable historical proof a hard failure at its first assertion', () => {
  const proof = integrationProof('art/generated/__unavailable-proof__/integration-verification.json');
  expect(() => proof.currentSHA256).toThrow(/ENOENT/);
  expect(() => Object.keys(proof)).toThrow(/ENOENT/);
});
it('exposes the exact existing proof without invented defaults or modified hashes', () => {
  const file = 'docs/verification/warrior-spear-release-v1/integration-verification.json';
  const expected: unknown = JSON.parse(readFileSync(file, 'utf8'));
  expect(JSON.parse(JSON.stringify(integrationProof(file)))).toEqual(expected);
});

it('maps the entire original game inventory to real current files and preserves every public byte', () => {
  const original = JSON.parse(readFileSync('docs/architecture/DEPENDENCY_MAP_BEFORE.json', 'utf8')) as { files: { path: string; sha256: string }[] };
  const files = original.files.filter(file => /^(?:src|public)\//.test(file.path));
  expect([...historicalWalk('src'), ...historicalWalk('public')].sort()).toEqual(files.map(file => file.path).sort());
  for (const file of files.filter(file => file.path.startsWith('public/'))) {
    expect(createHash('sha256').update(readRuntimeFile(file.path)).digest('hex'), file.path).toBe(file.sha256);
  }
});
