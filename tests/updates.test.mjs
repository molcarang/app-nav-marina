import test from 'node:test';
import assert from 'node:assert/strict';
import { checkForUpdate, findAvailableUpdate } from '../services/updates/releases.js';
const current = { channel: 'main', buildNumber: 10, target: 'web' };
const url = 'https://github.com/molcarang/app-nav-marina/releases/download/build-11/navmarina-web.zip';
function release(buildNumber = 11, options = {}) {
    const { channel = 'main', target = 'web', ...rest } = options;
    const names = { web: 'navmarina-web.zip', raspberry: 'navmarina-raspberry.zip', android: 'navmarina-android.apk' };
    return { id: 22, draft: false, prerelease: channel !== 'main',
        body: JSON.stringify({ schema: 1, app: 'navmarina', version: '1.0.2', buildNumber, channel }),
        assets: [{ name: names[target], state: 'uploaded', browser_download_url: url }], ...rest };
}
test('detecta solo versiones posteriores completas del mismo canal', () => {
    const result = findAvailableUpdate([release(9), release(10), release(11), release(12, { draft: true }),
        release(99, { channel: 'Develop' })], current);
    assert.equal(result.buildNumber, 11);
    assert.equal(result.url, url);
    assert.equal(result.releaseId, 22);
    assert.equal(findAvailableUpdate([release(9), release(10)], current), null);
});
test('separa Develop, paquetes Android y Raspberry, sin avisar de versiones anteriores', () => {
    assert.equal(findAvailableUpdate([release(11)], { ...current, target: 'android' }), null);
    assert.equal(findAvailableUpdate([release(11, { target: 'android' })], { ...current, target: 'android' }).buildNumber, 11);
    assert.equal(findAvailableUpdate([release(11, { target: 'raspberry' })], { ...current, target: 'raspberry' }).buildNumber, 11);
    assert.equal(findAvailableUpdate([release(11, { channel: 'Develop' })], { ...current, channel: 'Develop' }).buildNumber, 11);
});
test('elige la compilacion mayor aunque las publicaciones terminen en otro orden', () => {
    assert.equal(findAvailableUpdate([release(11), release(15), release(13)], current).buildNumber, 15);
});
test('descarta notas ajenas, paquetes incompletos y URLs externas', () => {
    const unsafe = release();
    unsafe.assets[0].browser_download_url = 'https://example.com/file.zip';
    assert.equal(findAvailableUpdate([release(11, { body: 'ordinary release notes' }),
        release(11, { assets: [] }), unsafe, release(11, { prerelease: true }),
        release(11, { body: 'null' })], current), null);
    assert.equal(findAvailableUpdate({}, current), null);
});
test('consulta sin cache y transmite la cancelacion al cliente HTTP', async () => {
    const controller = new AbortController();
    const result = await checkForUpdate(current, { signal: controller.signal, fetcher: async (endpoint, options) => {
        assert.match(endpoint, /^https:\/\/api.github.com\/repos\/molcarang\/app-nav-marina\/releases/);
        assert.equal(options.signal, controller.signal);
        assert.equal(options.cache, 'no-store');
        return { ok: true, json: async () => [release()] };
    } });
    assert.equal(result.buildNumber, 11);
    await assert.rejects(checkForUpdate(current, { fetcher: async () => ({ ok: false, status: 403 }) }), /403/);
    await assert.rejects(checkForUpdate(current, { fetcher: async () => { throw new Error('offline'); } }), /offline/);
});
