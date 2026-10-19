import assert from 'node:assert/strict';
import test from 'node:test';
import { monitorSignalKConnection } from '../services/signalk/connectionMonitor.js';

function setup(t, reply = true) {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] });
    const events = new EventTarget();
    let lost = 0;
    let confirmed = 0;
    let monitor;
    const socket = {
        readyState: 1, reply, messages: [],
        send(raw) {
            const message = JSON.parse(raw);
            this.messages.push(message);
            if (this.reply) monitor.message({ requestId: message.requestId, statusCode: 404 });
        },
    };
    monitor = monitorSignalKConnection(socket, () => lost++, {
        eventTarget: events, onConfirmed: () => confirmed++,
    });
    t.after(() => monitor.dispose());
    return { socket, monitor, events, lost: () => lost, confirmed: () => confirmed };
}

test('conexión: abrir TCP no confirma Signal K hasta recibir una respuesta válida', t => {
    const { monitor, socket, confirmed } = setup(t, false);
    monitor.opened();
    assert.equal(confirmed(), 0);
    const request = socket.messages[0];
    assert.deepEqual(Object.keys(request).sort(), ['query', 'requestId']);
    assert.equal(request.query, true);
    assert.match(request.requestId, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
    monitor.message({ requestId: request.requestId, statusCode: 404 });
    assert.equal(confirmed(), 1);
    t.mock.timers.tick(3000);
    assert.equal(confirmed(), 1);
});

test('conexión: servidor sin sensores permanece conectado si responde por el mismo WebSocket', t => {
    const { monitor, socket, lost, confirmed } = setup(t);
    monitor.opened();
    for (let i = 0; i < 20; i++) t.mock.timers.tick(1000);
    assert.equal(socket.messages.length, 5);
    assert.equal(lost(), 0);
    assert.equal(confirmed(), 1);
});

test('conexión: los valores constantes no evitan las comprobaciones periódicas', t => {
    const { monitor, socket, lost } = setup(t);
    monitor.opened();
    for (let i = 0; i < 20; i++) {
        monitor.message({ updates: [{ values: [{ path: 'navigation.speedOverGround', value: 0 }] }] });
        t.mock.timers.tick(1000);
    }
    assert.equal(socket.messages.length, 5);
    assert.equal(lost(), 0);
});

test('conexión: el corte silencioso se detecta aunque el socket no emita cierre', t => {
    const { monitor, socket, lost } = setup(t);
    monitor.opened();
    socket.reply = false;
    t.mock.timers.tick(5000);
    t.mock.timers.tick(2999);
    assert.equal(lost(), 0);
    t.mock.timers.tick(1);
    assert.equal(lost(), 1);
    t.mock.timers.tick(20000);
    assert.equal(lost(), 1);
    assert.equal(socket.readyState, 1);
});

test('conexión: recibir datos no oculta un fallo en el camino de ida o en las respuestas', t => {
    const { monitor, socket, lost } = setup(t);
    monitor.opened();
    socket.reply = false;
    t.mock.timers.tick(5000);
    for (let i = 0; i < 3; i++) {
        monitor.message({ updates: [] });
        t.mock.timers.tick(1000);
    }
    assert.equal(lost(), 1);
});

test('conexión: mensajes ajenos, malformados o con otro identificador no validan una comprobación', t => {
    const { monitor, socket, lost, confirmed } = setup(t, false);
    monitor.opened();
    for (const message of [null, [], {}, { requestId: 'other', statusCode: 404 },
        { requestId: socket.messages[0].requestId, statusCode: '404' }]) monitor.message(message);
    assert.equal(confirmed(), 0);
    t.mock.timers.tick(3000);
    assert.equal(lost(), 1);
});

test('conexión: un intento que nunca abre el socket caduca a los ocho segundos', t => {
    const { lost } = setup(t);
    t.mock.timers.tick(7999);
    assert.equal(lost(), 0);
    t.mock.timers.tick(1);
    assert.equal(lost(), 1);
});

for (const statusCode of [401, 403, 500]) test(`conexión: rechazo ${statusCode} invalida el enlace`, t => {
    const { monitor, socket, lost } = setup(t, false);
    monitor.opened();
    monitor.message({ requestId: socket.messages[0].requestId, statusCode });
    assert.equal(lost(), 1);
});

test('conexión: un fallo al enviar invalida inmediatamente el enlace', t => {
    const { monitor, socket, lost } = setup(t);
    socket.send = () => { throw new Error('Closed connection'); };
    monitor.opened();
    assert.equal(lost(), 1);
});

test('conexión: el evento offline verifica el enlace y no desconecta un servidor local que responde', t => {
    const { monitor, socket, events, lost } = setup(t);
    monitor.opened();
    events.dispatchEvent(new Event('offline'));
    assert.equal(lost(), 0);
    assert.equal(socket.messages.length, 2);
    socket.reply = false;
    events.dispatchEvent(new Event('offline'));
    t.mock.timers.tick(3000);
    assert.equal(lost(), 1);
});

test('conexión: desmontar cancela comprobaciones y las respuestas tardías no resucitan el estado', t => {
    const { monitor, socket, events, lost, confirmed } = setup(t, false);
    monitor.opened();
    monitor.dispose();
    events.dispatchEvent(new Event('offline'));
    monitor.message({ requestId: socket.messages[0].requestId, statusCode: 404 });
    t.mock.timers.tick(20000);
    assert.equal(socket.messages.length, 1);
    assert.equal(lost(), 0);
    assert.equal(confirmed(), 0);
});
