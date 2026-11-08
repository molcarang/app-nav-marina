import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateEngineConsumption, ENGINE_CONSUMPTION_INTERVAL_MS } from '../features/console/model/engineConsumption.js';
import { DEFAULT_ENGINE_CONSUMPTION_TABLE } from '../features/console/model/engineConsumptionTable.js';

test('consumo actual: conserva los nueve valores exactos de la tabla facilitada', () => {
    assert.equal(ENGINE_CONSUMPTION_INTERVAL_MS, 5000);
    for (const { rpm, litresPerHour } of DEFAULT_ENGINE_CONSUMPTION_TABLE) {
        assert.equal(estimateEngineConsumption(rpm, DEFAULT_ENGINE_CONSUMPTION_TABLE), litresPerHour);
    }
});

test('consumo actual: interpola entre entradas usando las RPM sin redondearlas', () => {
    for (const [rpm, expected] of [[1700, 1.35], [1900, 1.7], [2100, 2.15], [2500, 3.35], [3100, 5.95], [1650.5, 1.27575]]) {
        assert.ok(Math.abs(estimateEngineConsumption(rpm, DEFAULT_ENGINE_CONSUMPTION_TABLE) - expected) < 1e-9);
    }
});

test('consumo actual: sin datos válidos no inventa un consumo', () => {
    for (const rpm of [null, undefined, NaN, Infinity, -1, 0, '1800']) {
        assert.equal(estimateEngineConsumption(rpm, DEFAULT_ENGINE_CONSUMPTION_TABLE), null);
    }
    for (const table of [null, [], [{ rpm: 1600, litresPerHour: -1 }],
        [{ rpm: 1600, litresPerHour: 1 }, { rpm: 1600, litresPerHour: 2 }]]) {
        assert.equal(estimateEngineConsumption(1800, table), null);
    }
});

test('consumo actual: respeta tablas editadas, cero L/h y entradas desordenadas sin modificarlas', () => {
    const table = Object.freeze([Object.freeze({ rpm: 3000, litresPerHour: 0 }), Object.freeze({ rpm: 1000, litresPerHour: 4 })]);
    assert.equal(estimateEngineConsumption(2000, table), 2);
    assert.equal(estimateEngineConsumption(3000, table), 0);
    assert.equal(table[0].rpm, 3000);
    assert.equal(estimateEngineConsumption(1800, [{ rpm: 1800, litresPerHour: 1.5 }]), 1.5);
    assert.ok(Math.abs(estimateEngineConsumption(1799, [{ rpm: 1800, litresPerHour: 1.5 }]) - 1.4991666666666668) < 1e-9);
    assert.equal(estimateEngineConsumption(500, [{ rpm: 0, litresPerHour: 0 }]), null);
});

test('consumo actual: por debajo de la tabla estima proporcionalmente a la entrada más cercana', () => {
    for (const [rpm, expected] of [[500, 0.375], [800, 0.6], [1000, 0.75], [1599, 1.19925], [1600, 1.2]]) {
        assert.ok(Math.abs(estimateEngineConsumption(rpm, DEFAULT_ENGINE_CONSUMPTION_TABLE) - expected) < 1e-9);
    }
    assert.equal(DEFAULT_ENGINE_CONSUMPTION_TABLE[0].rpm, 1600);
    const withIdle = [{ rpm: 500, litresPerHour: 0.6 }, ...DEFAULT_ENGINE_CONSUMPTION_TABLE];
    assert.equal(estimateEngineConsumption(500, withIdle), 0.6);
    assert.ok(Math.abs(estimateEngineConsumption(1050, withIdle) - 0.9) < 1e-9);
});

test('consumo actual: por encima de la tabla estima proporcionalmente a la última entrada', () => {
    for (const [rpm, expected] of [[3200, 6.5], [3500, 7.109375], [4000, 8.125], [6400, 13]]) {
        assert.ok(Math.abs(estimateEngineConsumption(rpm, DEFAULT_ENGINE_CONSUMPTION_TABLE) - expected) < 1e-9);
    }
    assert.equal(estimateEngineConsumption(3000, [{ rpm: 1800, litresPerHour: 1.5 }]), 2.5);
});
