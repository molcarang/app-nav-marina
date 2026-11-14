import assert from 'node:assert/strict';
import test from 'node:test';
import { downloadAndroidApk } from '../scripts/android-apk-download.mjs';

const apk = () => new Response(new Uint8Array([0x50, 0x4b, 3, 4]));
const url = 'https://example.com/app.apk';

test('retries a timeout while reading the APK body and a temporary server failure', async () => {
  let calls = 0;
  const waits = [];
  let cancelled = false;
  const bytes = await downloadAndroidApk(url, {
    fetchImpl: async (_, { signal }) => {
      assert.ok(signal instanceof AbortSignal);
      calls++;
      if (calls === 1) return { ok: true, arrayBuffer: async () => { throw new DOMException('Timed out', 'TimeoutError'); } };
      if (calls === 2) return { ok: false, status: 503, body: { cancel: async () => { cancelled = true; } } };
      return apk();
    },
    sleep: async ms => waits.push(ms),
  });
  assert.deepEqual([...bytes], [0x50, 0x4b, 3, 4]);
  assert.equal(calls, 3);
  assert.equal(cancelled, true);
  assert.deepEqual(waits, [10000, 20000]);
});

test('stops after three network failures and retains the underlying error', async () => {
  const cause = new TypeError('fetch failed');
  let calls = 0;
  await assert.rejects(downloadAndroidApk(url, {
    fetchImpl: async () => { calls++; throw cause; },
    sleep: async () => {},
  }), error => error.cause === cause && /3 attempt/.test(error.message));
  assert.equal(calls, 3);
});

test('does not retry permanent HTTP errors or invalid APK contents', async () => {
  for (const response of [new Response('Missing', { status: 404 }), new Response('Not an APK')]) {
    let calls = 0;
    await assert.rejects(downloadAndroidApk(url, {
      fetchImpl: async () => { calls++; return response; },
      sleep: async () => assert.fail('Unexpected retry'),
    }), /HTTP 404|not a ZIP/);
    assert.equal(calls, 1);
  }
});
