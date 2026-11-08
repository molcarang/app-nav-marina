import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as identity from '../services/signalk/aisIdentity.js';
import * as timestamps from '../services/signalk/dataTimestamp.js';
import * as pendingUpdates from '../services/signalk/pendingUpdates.js';
import * as address from '../services/signalk/serverAddress.js';
import createPlugin from '../simulation/signalk-ais-demo/index.js';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const source = readFileSync(new URL('../services/signalk/useAisData.js', import.meta.url), 'utf8');
const { code } = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
const settle = () => new Promise(resolve => setImmediate(resolve));
const id = 'vessels.urn:mrn:imo:mmsi:224123450';

function receiver(t, fetchImpl = async () => ({ ok: false })) {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });
    const sockets = [];
    let state, cleanup;
    class Socket {
        constructor() { this.readyState = 0; this.sent = []; sockets.push(this); }
        send(raw) { this.sent.push(JSON.parse(raw)); }
        close() { this.readyState = 3; }
        open() { this.readyState = 1; this.onopen(); this.receive({ self: 'vessels.own' }); }
        receive(message) { this.onmessage?.({ data: JSON.stringify(message) }); }
    }
    const exports = {};
    const modules = {
        react: {
            useState(initial) { state = initial; return [state, next => { state = typeof next === 'function' ? next(state) : next; }]; },
            useEffect(effect) { cleanup = effect(); },
        },
        './dataTimestamp.js': timestamps,
        './pendingUpdates': pendingUpdates,
        './serverAddress': address,
        './aisIdentity.js': { ...identity, createAisIdentityLoader: options => identity.createAisIdentityLoader({ ...options, fetchImpl }) },
    };
    vm.runInNewContext(code, { exports, URL, Date, WebSocket: Socket,
        setInterval, clearInterval, setTimeout, clearTimeout,
        require(name) { if (!modules[name]) throw Error(name); return modules[name]; },
    });
    exports.useAisData('http://example.test:3000', true);
    t.after(() => cleanup());
    return { sockets, state: () => state, flush: () => t.mock.timers.tick(100), stop: () => cleanup() };
}
const delta = (values, context = id) => ({ context, updates: [{ values }] });
const livePosition = { latitude: 28.75, longitude: -13.84 };
const positionDelta = () => delta([{ path: 'navigation.position', value: livePosition }]);

test('suscripcion incluye la raiz y el parser admite identidad simple o envuelta', () => {
    assert.ok(identity.AIS_SUBSCRIPTION_PATHS.includes(''));
    assert.deepEqual(identity.readAisIdentity({ name: ' CORRALEJO EXPRESS@@ ', mmsi: 224123450 }), { name: 'CORRALEJO EXPRESS', mmsi: '224123450' });
    assert.deepEqual(identity.readAisIdentity({ name: { value: 'BARCO' }, mmsi: { value: '224123450' } }), { name: 'BARCO', mmsi: '224123450' });
    for (const value of [null, [], '', { name: {}, mmsi: null }, { name: '@@  ' }]) assert.deepEqual(identity.readAisIdentity(value), {});
});

test('URL REST conserva prefijo de proxy y HTTPS, sin parametros del stream', () => {
    assert.equal(identity.aisIdentityUrl('wss://example.test/sk/signalk/v1/stream?subscribe=none', id),
        'https://example.test/sk/signalk/v1/api/vessels/urn%3Amrn%3Aimo%3Ammsi%3A224123450');
});

test('nombres de los cuatro barcos del plugin atraviesan la suscripcion real', t => {
    let requests = 0;
    const app = receiver(t, async () => { requests++; return { ok: false }; });
    const socket = app.sockets[0];
    socket.open();
    const subscribed = new Set(socket.sent[0].subscribe.map(item => item.path));
    const plugin = createPlugin({ handleMessage(_, message) {
        socket.receive({ ...message, updates: message.updates.map(update => ({ ...update,
            values: update.values.filter(item => subscribed.has(item.path)) })) });
    } });
    try { plugin.start(); app.flush(); }
    finally { plugin.stop(); }
    assert.equal(Object.keys(app.state().targets).length, 4);
    assert.equal(app.state().targets[id].name, 'CORRALEJO EXPRESS');
    for (const target of Object.values(app.state().targets)) {
        assert.ok(target.name.length > 0);
        assert.match(target.mmsi, /^\d{9}$/);
        assert.ok(Number.isFinite(target['navigation.position'].latitude));
    }
    assert.equal(requests, 0);
});

test('un nombre ya almacenado se recupera por REST sin refrescar ni sustituir posiciones', async t => {
    let requests = 0;
    const app = receiver(t, async () => {
        requests++;
        return { ok: true, json: async () => ({ name: 'NOMBRE GUARDADO', mmsi: '224123450',
            navigation: { position: { value: { latitude: 0, longitude: 0 }, timestamp: '2000-01-01T00:00:00Z' } } }) };
    });
    const socket = app.sockets[0]; socket.open();
    socket.receive(positionDelta());
    app.flush();
    const before = app.state().targets[id].positionReceivedAt;
    await settle(); app.flush();
    const target = app.state().targets[id];
    assert.equal(target.name, 'NOMBRE GUARDADO');
    assert.equal(target['navigation.position'].latitude, livePosition.latitude);
    assert.equal(target.positionReceivedAt, before);
    assert.equal(target.collisionPositionReceivedAt, before);
    socket.receive(positionDelta()); app.flush();
    assert.equal(requests, 1);
});

test('una respuesta REST tardia no pisa un nombre mas reciente recibido por WebSocket', async t => {
    let finish;
    const app = receiver(t, () => new Promise(resolve => { finish = resolve; }));
    const socket = app.sockets[0]; socket.open(); socket.receive(positionDelta()); app.flush();
    socket.receive(delta([{ path: '', value: { name: 'NOMBRE NUEVO' } }])); app.flush();
    finish({ ok: true, json: async () => ({ name: 'NOMBRE ANTIGUO', mmsi: '224123450' }) });
    await settle(); app.flush();
    assert.equal(app.state().targets[id].name, 'NOMBRE NUEVO');
    assert.equal(app.state().targets[id].mmsi, '224123450');
    socket.receive(delta([{ path: 'name', value: { value: 'ULTIMO NOMBRE' } }])); app.flush();
    assert.equal(app.state().targets[id].name, 'ULTIMO NOMBRE');
    socket.receive(delta([{ path: '', value: { name: '' } }])); app.flush();
    assert.equal(app.state().targets[id].name, 'ULTIMO NOMBRE');
});

test('reconexion cancela consultas antiguas y recupera una identidad nueva', async t => {
    let finish, signal;
    const app = receiver(t, (_, options) => { signal = options.signal; return new Promise(resolve => { finish = resolve; }); });
    const socket = app.sockets[0]; socket.open(); socket.receive(positionDelta()); app.flush();
    socket.readyState = 3; socket.onclose();
    assert.equal(signal.aborted, true);
    t.mock.timers.tick(5000);
    const replacement = app.sockets[1]; replacement.open();
    replacement.receive(delta([{ path: '', value: { name: 'RECONNECTED' } }, { path: 'navigation.position', value: livePosition }])); app.flush();
    finish({ ok: true, json: async () => ({ name: 'STALE CONNECTION' }) });
    await settle(); app.flush();
    assert.equal(app.state().targets[id].name, 'RECONNECTED');
});

test('REST no disponible mantiene el AIS y limita los reintentos', async t => {
    let requests = 0;
    const app = receiver(t, async () => { requests++; throw Error('Network unavailable'); });
    const socket = app.sockets[0]; socket.open(); socket.receive(positionDelta());
    await settle(); app.flush();
    for (let i = 0; i < 5; i++) { socket.receive(positionDelta()); app.flush(); }
    assert.equal(requests, 1);
    assert.equal(app.state().status, 'connected');
    assert.equal(app.state().targets[id]['navigation.position'].latitude, livePosition.latitude);
    t.mock.timers.tick(30000);
    socket.receive(positionDelta()); await settle(); app.flush();
    assert.equal(requests, 2);
});

test('consultas de identidad limitadas a dos y canceladas al desmontar', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const signals = [];
    const pending = [];
    const updates = [];
    const loader = identity.createAisIdentityLoader({ socketUrl: 'ws://example.test/signalk/v1/stream',
        onIdentity: (...args) => updates.push(args),
        fetchImpl: (_, { signal }) => { signals.push(signal); return new Promise(resolve => pending.push(resolve)); } });
    t.after(() => loader.dispose());
    for (let i = 0; i < 6; i++) loader.request(`vessels.${i}`);
    assert.equal(signals.length, 2);
    assert.equal(loader.request('vessels.0'), false);
    pending[0]({ ok: true, json: async () => ({ name: 'ONE' }) });
    await settle();
    assert.equal(signals.length, 3);
    assert.equal(updates.length, 1);
    loader.dispose();
    assert.equal(signals[1].aborted, true);
    assert.equal(signals[2].aborted, true);
    pending[1]({ ok: true, json: async () => ({ name: 'LATE' }) });
    await settle();
    assert.equal(updates.length, 1);
    assert.equal(signals.length, 3);
});
