import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function worker({ offline = false, installFails = false } = {}) {
  const handlers = {};
  const deleted = [];
  const downloaded = [];
  let claimed = false;
  const current = 'navmarina-pwa-current';
  const files = ['/index.html', '/modal.html', '/assets/app.js'];
  const contents = new Map(files.map((path) => [path, `cached:${path}`]));
  const cache = {
    addAll: async (paths) => {
      downloaded.push(...paths);
      if (installFails) throw new Error('Download failed');
    },
    match: async (path) => contents.get(path),
  };
  const context = {
    URL,
    self: {
      location: { origin: 'https://navmarina.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      clients: { claim: async () => { claimed = true; } },
    },
    caches: {
      open: async () => cache,
      keys: async () => [current, 'navmarina-pwa-old', 'another-app-cache'],
      delete: async (name) => { deleted.push(name); },
    },
    fetch: async () => {
      if (offline) throw new Error('Offline');
      return 'network';
    },
  };
  const source = readFileSync(new URL('../scripts/pwa-worker.js', import.meta.url), 'utf8')
    .replace('__CACHE_NAME__', JSON.stringify(current))
    .replace('__APP_FILES__', JSON.stringify(files));
  vm.runInNewContext(source, context);
  return {
    downloaded, deleted, isClaimed: () => claimed,
    async lifecycle(name) {
      let promise;
      handlers[name]({ waitUntil: (value) => { promise = value; } });
      await promise;
    },
    async request(path, mode = 'cors', method = 'GET') {
      let response;
      handlers.fetch({
        request: { url: new URL(path, context.self.location.origin).href, mode, method },
        respondWith: (value) => { response = value; },
      });
      return response;
    },
  };
}

test('opens the dashboard, a route and bundled assets without a network', async () => {
  const sw = worker({ offline: true });
  assert.equal(await sw.request('/', 'navigate'), 'cached:/index.html');
  assert.equal(await sw.request('/modal', 'navigate'), 'cached:/modal.html');
  assert.equal(await sw.request('/assets/app.js'), 'cached:/assets/app.js');
});

test('does not intercept telemetry, query requests or remote maps', async () => {
  const sw = worker({ offline: true });
  for (const url of ['/signalk/v1/api/vessels/self', '/assets/app.js?live=1',
    'https://maps.test/tile.png', 'https://signalk.test/index.html']) {
    assert.equal(await sw.request(url), undefined);
  }
  assert.equal(await sw.request('/index.html', 'cors', 'POST'), undefined);
  assert.equal(await sw.request('/unknown', 'navigate'), 'cached:/index.html');
});

test('installation propagates download failures', async () => {
  const sw = worker({ installFails: true });
  await assert.rejects(sw.lifecycle('install'), /Download failed/);
  assert.equal(sw.isClaimed(), false);
});

test('activation deletes only obsolete NavMarina caches', async () => {
  const sw = worker();
  await sw.lifecycle('install');
  assert.deepEqual(sw.downloaded, ['/index.html', '/modal.html', '/assets/app.js']);
  await sw.lifecycle('activate');
  assert.deepEqual(sw.deleted, ['navmarina-pwa-old']);
  assert.equal(sw.isClaimed(), true);
});
