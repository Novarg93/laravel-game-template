import { readFileSync } from 'node:fs';
import { runtimePath } from './runtimePath';

// Historical manifests retain their authored paths. Resolve only the filename;
// return actual file bytes, including for hashes and immutable JSON proofs.
export function readRuntimeFile(file: string): Buffer;
export function readRuntimeFile(file: string, encoding: 'utf8'): string;
export function readRuntimeFile(file: string, encoding?: 'utf8'): Buffer | string {
  return encoding ? readFileSync(runtimePath(file), encoding) : readFileSync(runtimePath(file));
}
