import { readFileSync } from 'node:fs';

export interface IntegrationProof {
  baselineFiles: number;
  changed: string[];
  added: string[];
  unchanged: number;
  currentSHA256: Record<string, string>;
}

/** Read the real immutable proof on first use. Missing files still throw ENOENT. */
export function integrationProof(file: string): IntegrationProof {
  let proof: IntegrationProof | undefined;
  function load(): IntegrationProof {
    proof ??= JSON.parse(readFileSync(file, 'utf8')) as IntegrationProof;
    return proof;
  }
  return new Proxy({} as IntegrationProof, {
    get: (_target, key) => Reflect.get(load(), key),
    has: (_target, key) => Reflect.has(load(), key),
    ownKeys: () => Reflect.ownKeys(load()),
    getOwnPropertyDescriptor: (_target, key) => Reflect.getOwnPropertyDescriptor(load(), key),
  });
}
