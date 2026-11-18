import { afterEach,expect,it,vi } from 'vitest';

import { internalRoute } from '../../resources/js/lib/internalRoutes';

import { HttpPlatform } from '../../resources/js/platform/HttpPlatform';

import { gameAssetUrl } from '../../game/assets';

afterEach(() => vi.unstubAllGlobals());

it('resolves internal paths centrally and rejects absolute or escaping URLs', () => {
  expect(internalRoute('/runs/uuid/actions')).toBe('/internal/runs/uuid/actions');
  for (const path of ['https://example.com', '//example.com', '/runs/../wallet', '/%2e%2e', '/wallet?user=2', '/\\evil']) expect(() => internalRoute(path)).toThrow();
});

it('resolves static assets independently of the Vite build base', () => {
  expect(gameAssetUrl('assets/hd/core.png')).toBe('/game-assets/hd/core.png');
  expect(gameAssetUrl('game-assets/audio/music.mp3')).toBe('/game-assets/audio/music.mp3');
});

it('keeps request payload and operation ID identical when HttpPlatform retries a lost response', async () => {
  vi.stubGlobal('document', { querySelector: () => ({ content: 'session-csrf' }) });
  const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('connection lost')).mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  const platform = new HttpPlatform();
  const operation = crypto.randomUUID();
  await platform.commerce.purchase('healing_potion', 25, operation);
  expect(fetcher).toHaveBeenCalledTimes(2);
  const [url, options] = fetcher.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('/internal/shop/purchases');
  expect(options).toMatchObject({ method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': 'session-csrf', Accept: 'application/json' } });
  expect(options.body).toBe(fetcher.mock.calls[1][1].body);
  expect(JSON.parse(String(options.body))).toEqual({ product_key: 'healing_potion', quantity: 1, expected_unit_price: 25, operation_id: operation });
  platform.destroy();
});

it('starts a run through the same-origin adapter using the existing response contract', async () => {
  vi.stubGlobal('document', { querySelector: () => ({ content: 'csrf' }) });
  const clientId = crypto.randomUUID(), serverId = crypto.randomUUID();
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ client_run_id: clientId, server_run_id: serverId, seed: 42, bonuses: {}, economy: { enabled: true, version: 'v1', revive_limit: 1, revive_health_basis_points: 5000, revive_protection_ms: 1500 } })));
  vi.stubGlobal('fetch', fetcher);
  const platform = new HttpPlatform();
  expect(await platform.start('mage', 'grove', false)).toMatchObject({ clientRunId: clientId, seed: 42 });
  expect(fetcher.mock.calls[0][0]).toBe('/internal/runs');
  platform.destroy();
});
