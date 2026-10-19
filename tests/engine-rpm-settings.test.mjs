import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEngineRpmSettings } from '../features/console/model/engineRpmSettings.js';
import { DEFAULT_SETTINGS } from '../features/console/model/settings.js';

test('tacómetro: ajustes antiguos o ausentes reciben valores predeterminados', () => {
    assert.deepEqual(normalizeEngineRpmSettings(), { tachometerMaxRpm: 5000, tachometerRedZoneRpm: 4000 });
    assert.deepEqual(normalizeEngineRpmSettings(DEFAULT_SETTINGS), { tachometerMaxRpm: 5000, tachometerRedZoneRpm: 4000 });
    for (const invalid of [null, undefined, NaN, Infinity, -100, '6000', 0, 21000]) {
        assert.equal(normalizeEngineRpmSettings({ tachometerMaxRpm: invalid }).tachometerMaxRpm, 5000);
    }
});

test('tacómetro: el inicio rojo se conserva dentro de la escala al reducir el máximo', () => {
    assert.deepEqual(normalizeEngineRpmSettings({ tachometerMaxRpm: 3000, tachometerRedZoneRpm: 4000 }),
        { tachometerMaxRpm: 3000, tachometerRedZoneRpm: 3000 });
    assert.deepEqual(normalizeEngineRpmSettings({ tachometerMaxRpm: 6000, tachometerRedZoneRpm: 4500 }),
        { tachometerMaxRpm: 6000, tachometerRedZoneRpm: 4500 });
    assert.equal(normalizeEngineRpmSettings({ tachometerMaxRpm: 1000 }).tachometerRedZoneRpm, 1000);
    assert.equal(normalizeEngineRpmSettings({ tachometerMaxRpm: 20000, tachometerRedZoneRpm: 0 }).tachometerRedZoneRpm, 0);
});

test('tacómetro: conserva las RPM exactas y rechaza una zona roja no válida', () => {
    assert.deepEqual(normalizeEngineRpmSettings({ tachometerMaxRpm: 4567, tachometerRedZoneRpm: 3456 }),
        { tachometerMaxRpm: 4567, tachometerRedZoneRpm: 3456 });
    for (const invalid of [null, undefined, NaN, Infinity, -100, '4000', 21000]) {
        assert.equal(normalizeEngineRpmSettings({ tachometerRedZoneRpm: invalid }).tachometerRedZoneRpm, 4000);
    }
});
