import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { SIGNALK_FIELDS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';
const require = createRequire(import.meta.url);
const createPlugin = require('../simulation/signalk-standard-demo');
const { createValues, normalizeOptions } = require('../simulation/signalk-standard-demo/scenario');
const fields = require('../simulation/signalk-standard-demo/fields.json');

test('el simulador estándar alimenta la app sin los plugins antiguos', () => {
    const messages = [];
    const plugin = createPlugin({ handleMessage: (source, message) => messages.push(message) });
    try {
        plugin.start({ engineRpm: 1800, autopilotState: 'auto', depthMin: 1, depthMax: 3 });
        assert.equal(messages.length, 1);
        assert.equal(messages[0].context, 'vessels.self');
        const navigation = deriveNavigationData(readInstrumentDelta(messages[0]));
        assert.equal(navigation.position.latitude, 28.73688887633891);
        assert.equal(navigation.position.longitude, -13.8627767277691);
        for (const key of ['depthMeters', 'vesselHeelDeg', 'driftKnots', 'setDeg', 'cogDeg', 'headingDeg', 'rudderAngle', 'awa']) {
            assert.ok(Number.isFinite(navigation[key]), key);
        }
        assert.ok(navigation.depthMeters >= 1 && navigation.depthMeters <= 3);
        assert.equal(navigation.engineRpm, 1800);
        assert.equal(navigation.navigationMode, 'ENGINE');
        assert.equal(navigation.apState, 'auto');
        assert.notEqual(navigation.cogDigital, navigation.headingDigital);
        assert.ok(Number(navigation.twsKnots) > 0);
        assert.ok(Number(navigation.sogKnots) > 0);
    } finally { plugin.stop(); }
});

test('publica cada segundo, reinicia sin duplicar timers y se detiene', context => {
    context.mock.timers.enable({ apis: ['setInterval', 'Date'] });
    let count = 0;
    const plugin = createPlugin({ handleMessage: () => count++ });
    plugin.start();
    context.mock.timers.tick(1000);
    assert.equal(count, 2);
    plugin.start();
    context.mock.timers.tick(1000);
    assert.equal(count, 4);
    plugin.stop();
    context.mock.timers.tick(5000);
    assert.equal(count, 4);
});

test('catálogo sincronizado, sin rutas privadas ni valores duplicados', () => {
    for (const [name, field] of Object.entries(fields)) {
        assert.equal(field.path, SIGNALK_FIELDS[name].path);
    }
    for (const time of [0, 15, 30, 45, 60]) {
        const values = createValues(time);
        assert.equal(new Set(values.map(value => value.path)).size, values.length);
        assert.ok(!values.some(value => value.path.startsWith('simulation.') || value.path.startsWith('vessels.')));
        assert.ok(values.find(value => value.path === 'navigation.attitude').value.roll <= Math.PI / 12 + 1e-6);
    }
    assert.notDeepEqual(createValues(15), createValues(45));
});

test('configuración inválida no genera coordenadas ni unidades inválidas', () => {
    const config = normalizeOptions({ latitude: 100, longitude: NaN, engineRpm: -1,
        autopilotState: 'invalid', depthMin: 5, depthMax: 1 });
    assert.equal(config.latitude, 28.73688887633891);
    assert.equal(config.longitude, -13.8627767277691);
    assert.equal(config.engineRpm, 0);
    assert.equal(config.autopilotState, 'standby');
    assert.equal(config.depthMin, 1);
    assert.equal(config.depthMax, 5);
});
