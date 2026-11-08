import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ENGINE_CONSUMPTION_TABLE, ENGINE_CONSUMPTION_REFERENCE_VERSION, isValidEngineConsumptionTable, normalizeEngineConsumptionTable, parseEngineConsumptionRows, restoreEngineConsumptionSettings } from '../features/console/model/engineConsumptionTable.js';
import { readFileSync } from 'node:fs';
import { DEFAULT_SETTINGS } from '../features/console/model/settings.js';

test('consumo: tabla inicial con los nueve límites superiores facilitados por el usuario', () => {
    const reference = JSON.parse(readFileSync(new URL('../config/engineConsumptionReference.json', import.meta.url), 'utf8'));
    const expected = reference.map(({ rpm, maximumLitresPerHour }) => ({ rpm, litresPerHour: maximumLitresPerHour }));
    assert.equal(expected.length, 9);
    assert.deepEqual(DEFAULT_ENGINE_CONSUMPTION_TABLE, expected);
    assert.deepEqual(DEFAULT_SETTINGS.engineConsumptionTable, expected);
    assert.deepEqual(restoreEngineConsumptionSettings(), {
        engineConsumptionTable: expected, engineConsumptionReferenceVersion: ENGINE_CONSUMPTION_REFERENCE_VERSION,
    });
});

test('consumo: restauración segura de tablas corruptas', () => {
    for (const value of [undefined, null, {}, '', [null], [undefined], Array(1),
        [{ rpm: 800, litresPerHour: -1 }], [{ rpm: '800', litresPerHour: 1 }]]) {
        assert.equal(isValidEngineConsumptionTable(value), false);
        assert.deepEqual(normalizeEngineConsumptionTable(value), []);
    }
    assert.equal(isValidEngineConsumptionTable([]), true);
});

test('consumo: incorpora la referencia una sola vez y respeta las ediciones y eliminaciones posteriores', () => {
    const oldTable = [{ rpm: 900, litresPerHour: 0.5 }, { rpm: 1600, litresPerHour: 0.9 }];
    const initialized = restoreEngineConsumptionSettings({ engineConsumptionTable: oldTable });
    assert.equal(initialized.engineConsumptionTable.length, 10);
    assert.deepEqual(initialized.engineConsumptionTable[0], oldTable[0]);
    assert.deepEqual(initialized.engineConsumptionTable[1], { rpm: 1600, litresPerHour: 1.2 });
    assert.equal(oldTable[1].litresPerHour, 0.9);
    const edited = { ...initialized, engineConsumptionTable: [{ rpm: 1600, litresPerHour: 1.1 }] };
    assert.deepEqual(restoreEngineConsumptionSettings(edited), edited);
    const cleared = { ...initialized, engineConsumptionTable: [] };
    assert.deepEqual(restoreEngineConsumptionSettings(cleared), cleared);
});

test('consumo: guarda pares ordenados, conserva cero y decimales y no modifica la tabla original', () => {
    const original = Object.freeze([Object.freeze({ rpm: 2500, litresPerHour: 4.75, id: 'draft-id' }),
        Object.freeze({ rpm: 0, litresPerHour: 0 }), Object.freeze({ rpm: 1500, litresPerHour: 2.123 })]);
    assert.deepEqual(normalizeEngineConsumptionTable(original), [
        { rpm: 0, litresPerHour: 0 }, { rpm: 1500, litresPerHour: 2.123 }, { rpm: 2500, litresPerHour: 4.75 },
    ]);
    assert.equal(original[0].rpm, 2500);
    assert.equal(original[0].id, 'draft-id');
});

test('consumo: acepta coma o punto decimal y rechaza RPM repetidas, incluso con ceros iniciales', () => {
    assert.deepEqual(parseEngineConsumptionRows([
        { rpm: '1500', litresPerHour: ' 2,5 ' }, { rpm: '0800', litresPerHour: '.75' },
    ]), { table: [{ rpm: 800, litresPerHour: 0.75 }, { rpm: 1500, litresPerHour: 2.5 }], error: null });
    assert.deepEqual(parseEngineConsumptionRows([
        { rpm: '800', litresPerHour: '1' }, { rpm: '0800', litresPerHour: '2' },
    ]), { table: null, error: 'consumptionTableDuplicate', row: 2 });
    assert.equal(isValidEngineConsumptionTable([{ rpm: 800, litresPerHour: 1 }, { rpm: 800, litresPerHour: 2 }]), false);
});

test('consumo: campos vacíos no se convierten en cero y los errores identifican la fila', () => {
    for (const entry of [
        { rpm: '', litresPerHour: '1' }, { rpm: '800', litresPerHour: '' },
        { rpm: '-800', litresPerHour: '1' }, { rpm: '800.5', litresPerHour: '1' },
        { rpm: '20001', litresPerHour: '1' }, { rpm: '800', litresPerHour: '-2' },
        { rpm: '800', litresPerHour: 'Infinity' }, { rpm: '800', litresPerHour: '2,3,4' },
        { rpm: '0x10', litresPerHour: '1' }, { rpm: '800', litresPerHour: '1e2' },
    ]) {
        assert.deepEqual(parseEngineConsumptionRows([{ rpm: '0', litresPerHour: '0' }, entry]),
            { table: null, error: 'consumptionTableInvalid', row: 2 });
    }
});

test('consumo: permite borrar toda la tabla y no presupone que el consumo sea creciente', () => {
    assert.deepEqual(parseEngineConsumptionRows([]), { table: [], error: null });
    assert.deepEqual(parseEngineConsumptionRows([{ rpm: '1000', litresPerHour: '2' }, { rpm: '2000', litresPerHour: '1.5' }]),
        { table: [{ rpm: 1000, litresPerHour: 2 }, { rpm: 2000, litresPerHour: 1.5 }], error: null });
});
