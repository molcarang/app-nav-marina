import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineConsumptionTotal, readEngineConsumptionTotal } from '../features/console/model/engineConsumptionTotal.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';

const input = (time, overrides = {}) => ({ rate: 3.6, rpm: 1800, receivedAt: time, connected: true, active: true, source: 'boat', ...overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('acumulado: suma intervalos reales, conserva precisión y cierra la fracción final al parar', () => {
    const total = createEngineConsumptionTotal();
    total.update(input(0), 0);
    total.update(input(5000), 5000); near(total.tick(5000), 0.005);
    total.update(input(10000), 10000); near(total.tick(10000), 0.01);
    near(total.update(input(12500, { rpm: 0, rate: null }), 12500), 0.0125);
    near(total.tick(20000), 0.0125);
    total.update(input(30000), 30000);
    total.update(input(35000), 35000); near(total.tick(35000), 0.0175);
});

test('acumulado: desconexiones, segundo plano y lecturas ausentes no suman tiempo desconocido', () => {
    for (const interruption of [{ connected: false }, { active: false }, { rpm: null, receivedAt: null }, { rate: null }]) {
        const total = createEngineConsumptionTotal(1);
        total.update(input(0), 0);
        total.update(input(4000), 4000);
        near(total.update(input(null, interruption), 9000), 1.004);
        near(total.tick(100000), 1.004);
        total.update(input(100000), 100000);
        total.update(input(105000), 105000); near(total.tick(105000), 1.009);
    }
});

test('acumulado: usa el consumo anterior hasta el cambio y no cuenta dos veces un intervalo', () => {
    const total = createEngineConsumptionTotal();
    total.update(input(0), 0);
    near(total.update(input(5000, { rate: 7.2 }), 5000), 0.005);
    near(total.tick(5000), 0.005);
    total.update(input(10000, { rate: 7.2 }), 10000); near(total.tick(10000), 0.015);
    near(total.tick(10000), 0.015);
});

test('acumulado: persistir solo litros evita sumar el tiempo con la aplicación cerrada', () => {
    const previous = createEngineConsumptionTotal(2.123456789);
    const serialized = JSON.stringify({ schema: 1, litres: previous.litres });
    const next = createEngineConsumptionTotal(readEngineConsumptionTotal(serialized));
    next.update(input(3600000), 3600000);
    near(next.tick(3600000), 2.123456789);
    next.update(input(3605000), 3605000); near(next.tick(3605000), 2.128456789);
});

test('acumulado: reinicio manual no recupera el consumo anterior al reinicio', () => {
    const total = createEngineConsumptionTotal(4);
    total.update(input(0), 0);
    total.update(input(4000), 4000);
    assert.equal(total.reset(4500), 0);
    total.update(input(5000), 5000); near(total.tick(5000), 0.0005);
});

test('acumulado: no acumula más allá de la última observación ni durante saltos de tiempo o de servidor', () => {
    const total = createEngineConsumptionTotal();
    total.update(input(0), 0); total.update(input(4000), 4000);
    near(total.tick(30000), 0.004);
    near(total.tick(60000), 0.004);
    total.update(input(120000), 120000);
    near(total.update(input(125000, { source: 'other' }), 125000), 0.004);
    total.update(input(130000, { source: 'other' }), 130000); near(total.tick(130000), 0.009);
    total.update(input(100000, { source: 'other' }), 100000);
    assert.ok(total.tick(100000) >= 0.009);
});

test('acumulado: no reemplaza por cero una lectura persistida inválida', () => {
    assert.equal(readEngineConsumptionTotal(null), 0);
    for (const value of ['bad json', 'null', '{}', '{"schema":1,"litres":-1}', '{"schema":1,"litres":"2"}']) {
        assert.throws(() => readEngineConsumptionTotal(value));
    }
});

test('RPM: conserva la hora de recepción aunque el valor sea constante y selecciona la unidad del tacómetro', () => {
    const message = { context: 'vessels.self', updates: [{ values: [{ path: 'propulsion.main.revolutions', value: 30 }] }] };
    let data = readInstrumentDelta(message, undefined, 1000);
    assert.equal(deriveNavigationData(data).engineRpmReceivedAt, 1000);
    data = { ...data, ...readInstrumentDelta(message, undefined, 2000) };
    assert.equal(deriveNavigationData(data).engineRpmReceivedAt, 2000);
    data['propulsion.other.revolutions'] = 20; data['propulsion.other.revolutions.receivedAt'] = 3000;
    assert.equal(deriveNavigationData(data).engineRpmReceivedAt, 2000);
});
