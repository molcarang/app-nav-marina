import test from 'node:test';
import assert from 'node:assert/strict';
import { getRaspberryUpdateStatus, installRaspberryUpdate } from '../services/updates/raspberry.js';

test('el cliente local consulta capacidades y solo instala mediante POST con token', async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    try {
        globalThis.fetch = async (url, options) => {
            calls.push({ url, options });
            return { ok: true, json: async () => ({ protocol: 1, token: 'session-token', state: 'idle' }) };
        };
        const status = await getRaspberryUpdateStatus();
        assert.equal(status.protocol, 1);
        await installRaspberryUpdate(22, status.token);
        assert.equal(calls[0].url, '/api/updates');
        assert.equal(calls[0].options.cache, 'no-store');
        assert.equal(calls[1].options.method, 'POST');
        assert.equal(calls[1].options.headers['X-NavMarina-Token'], 'session-token');
        assert.deepEqual(JSON.parse(calls[1].options.body), { releaseId: 22 });
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ protocol: 99, token: 'session-token' }) });
        await assert.rejects(getRaspberryUpdateStatus(), /Incompatible/);
        globalThis.fetch = async () => ({ ok: false, status: 404 });
        await assert.rejects(getRaspberryUpdateStatus(), /404/);
    } finally { globalThis.fetch = originalFetch; }
});
