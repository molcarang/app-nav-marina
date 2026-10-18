import test from 'node:test';
import assert from 'node:assert/strict';
import { getSignalKSocketUrl, normalizeServerAddress, DEFAULT_SIGNALK_ADDRESS } from '../services/signalk/serverAddress.js';

test('convierte direcciones del servidor al stream Signal K', () => {
    assert.equal(getSignalKSocketUrl(DEFAULT_SIGNALK_ADDRESS), 'ws://openplotter.local:3000/signalk/v1/stream');
    assert.equal(getSignalKSocketUrl(' 192.168.1.10:3000 '), 'ws://192.168.1.10:3000/signalk/v1/stream');
    assert.equal(getSignalKSocketUrl('https://boat.example'), 'wss://boat.example/signalk/v1/stream');
    assert.equal(getSignalKSocketUrl('https://boat.example/proxy/'), 'wss://boat.example/proxy/signalk/v1/stream');
    assert.equal(getSignalKSocketUrl('ws://boat:3000/signalk/v1/stream'), 'ws://boat:3000/signalk/v1/stream');
    assert.equal(getSignalKSocketUrl('wss://boat/signalk/v1/stream?subscribe=none'), 'wss://boat/signalk/v1/stream?subscribe=none');
    assert.equal(getSignalKSocketUrl('[::1]:3000'), 'ws://[::1]:3000/signalk/v1/stream');
});

test('rechaza direcciones vacías, protocolos incompatibles y credenciales', () => {
    for (const address of ['', ' ', 'foo bar', 'ftp://boat', 'http://', 'http://boat:99999', 'http://user:secret@boat', 'http://boat/#admin', null]) {
        assert.throws(() => normalizeServerAddress(address));
    }
});
