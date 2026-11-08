import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineHours, readEngineHours } from '../features/console/model/engineHours.js';

const input = (time, overrides = {}) => ({ rpm: 1800, receivedAt: time,
    connected: true, active: true, source: 'boat', ...overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10,
    `${actual} != ${expected}`);

test('horas de motor: acumula tiempo con RPM y conserva el total entre sesiones', () => {
    const total = createEngineHours(12.5);
    total.update(input(0), 0);
    for (let time = 5000; time <= 1800000; time += 5000) total.update(input(time), time);
    near(total.tick(1800000), 13);
    for (let time = 1805000; time < 2700000; time += 5000) total.update(input(time), time);
    total.update(input(2700000, { rpm: 0 }), 2700000);
    near(total.hours, 13.25);
    near(total.tick(3600000), 13.25);

    const saved = JSON.stringify({ schema: 1, hours: total.hours });
    near(readEngineHours(saved), 13.25);
});

test('horas de motor: no cuenta desconexiones, segundo plano ni tiempo con la app cerrada', () => {
    const total = createEngineHours();
    total.update(input(0), 0);
    total.update(input(5000), 5000);
    near(total.update(input(null, { connected: false, receivedAt: null }), 10000), 5000 / 3600000);
    near(total.tick(20000), 5000 / 3600000);
    total.update(input(20000, { active: false }), 20000);
    near(total.tick(30000), 5000 / 3600000);
});

test('horas de motor: rechaza datos persistidos inválidos', () => {
    assert.equal(readEngineHours(null), 0);
    for (const value of ['bad json', '{}', '{"schema":1,"hours":-1}', '{"schema":1,"hours":"2"}']) {
        assert.throws(() => readEngineHours(value));
    }
});

test('horas de motor: adopta el total de Signal K y continúa desde él si falta la ruta', () => {
    const total = createEngineHours(2);
    assert.equal(total.replace(2569, 1000), 2569);
    total.update(input(1000), 1000);
    total.update(input(6000), 6000);
    near(total.tick(6000), 2569 + 5000 / 3600000);
});
