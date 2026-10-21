import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { SIGNALK_FIELDS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';
import { isLowFuelAlarmActive } from '../features/console/model/lowFuelAlarm.js';
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
        assert.equal(navigation.waterTemperatureCelsius, 22);
        assert.equal(navigation.engineTemperatureCelsius, 85);
        assert.equal(navigation.engineOilPressureBar, 4);
        assert.equal(navigation.fuelLevelPercent, 75);
        assert.equal(navigation.batteryVoltage, 13.8);
        assert.equal(navigation.alternatorChargeAlarm, false);
        assert.equal(navigation.navigationMode, 'ENGINE');
        assert.equal(navigation.apState, 'auto');
        assert.notEqual(navigation.cogDigital, navigation.headingDigital);
        assert.ok(Number(navigation.twsKnots) > 0);
        assert.ok(Number(navigation.sogKnots) > 0);
    } finally { plugin.stop(); }
});

test('temperatura configurable en Celsius publicada en kelvin', () => {
    const water = options => createValues(0, options).find(item => item.path === 'environment.water.temperature').value;
    assert.equal(water({ waterTemperatureCelsius: 0 }), 273.15);
    assert.equal(water({ waterTemperatureCelsius: -2 }), 271.15);
    assert.equal(water({ waterTemperatureCelsius: '22' }), 295.15);
});

test('temperatura PGN 127489 configurable llega al reloj sin modificar el agua del mar', () => {
    for (const celsius of [0, 60, 95, 120]) {
        const values = createValues(0, { engineTemperatureCelsius: celsius });
        const reading = values.find(item => item.path === 'propulsion.0.temperature');
        assert.equal(reading.value, celsius + 273.15);
        const navigation = deriveNavigationData(readInstrumentDelta({ context: 'vessels.self', updates: [{ values }] }));
        assert.ok(Math.abs(navigation.engineTemperatureCelsius - celsius) < 1e-9);
        assert.equal(navigation.waterTemperatureCelsius, 22);
    }
    for (const value of [null, '90', NaN, Infinity, -10, 151]) {
        assert.equal(normalizeOptions({ engineTemperatureCelsius: value }).engineTemperatureCelsius, 85);
    }
});

test('presión de aceite PGN 127489 configurable se publica en Pa y llega al reloj en bar', () => {
    for (const bar of [0, 1.5, 4, 10]) {
        const values = createValues(0, { engineOilPressureBar: bar });
        assert.equal(values.find(item => item.path === 'propulsion.0.oilPressure').value, bar * 100000);
        const navigation = deriveNavigationData(readInstrumentDelta({ context: 'vessels.self', updates: [{ values }] }));
        assert.equal(navigation.engineOilPressureBar, bar);
        assert.equal(navigation.engineTemperatureCelsius, 85);
        assert.equal(navigation.oilPressureAlarm, false);
    }
    for (const value of [null, '4', NaN, Infinity, -1, 11]) {
        assert.equal(normalizeOptions({ engineOilPressureBar: value }).engineOilPressureBar, 4);
    }
});

test('combustible y batería configurables usan ratio y voltios y alimentan ambos relojes', () => {
    for (const [fuelLevelPercent, batteryVoltage] of [[0, 0], [20, 12.4], [75, 13.8], [100, 32]]) {
        const values = createValues(0, { fuelLevelPercent, batteryVoltage });
        assert.equal(values.find(item => item.path === 'tanks.fuel.0.currentLevel').value, fuelLevelPercent / 100);
        assert.equal(values.find(item => item.path === 'electrical.batteries.0.voltage').value, batteryVoltage);
        const navigation = deriveNavigationData(readInstrumentDelta({ context: 'vessels.self', updates: [{ values }] }));
        assert.equal(navigation.fuelLevelPercent, fuelLevelPercent);
        assert.equal(navigation.batteryVoltage, batteryVoltage);
        assert.equal(isLowFuelAlarmActive(true, navigation.fuelLevelPercent, 20), fuelLevelPercent <= 20);
        assert.equal(navigation.lowBatteryAlarm, false);
    }
    for (const value of [null, '10', NaN, Infinity, -1, 101]) {
        const config = normalizeOptions({ fuelLevelPercent: value, batteryVoltage: value });
        assert.equal(config.fuelLevelPercent, 75);
        assert.equal(config.batteryVoltage, 13.8);
    }
    assert.equal(normalizeOptions({ batteryVoltage: 33 }).batteryVoltage, 13.8);
});

test('testigo de alternador activa y restablece la notificación sin depender de RPM o voltaje', () => {
    for (const engineRpm of [0, 1800]) {
        for (const active of [false, true, false]) {
            const values = createValues(0, { engineRpm, batteryVoltage: 13.8, alternatorChargeAlarm: active });
            const notification = values.find(item => item.path === 'notifications.propulsion.0.chargeIndicator').value;
            assert.equal(notification.state, active ? 'alarm' : 'normal');
            assert.deepEqual(notification.method, active ? ['visual'] : []);
            const navigation = deriveNavigationData(readInstrumentDelta({ context: 'vessels.self', updates: [{ values }] }));
            assert.equal(navigation.alternatorChargeAlarm, active);
            assert.equal(navigation.engineRpm, engineRpm);
            assert.equal(navigation.batteryVoltage, 13.8);
        }
    }
    for (const value of [null, 'true', 'false', 0, 1]) {
        assert.equal(normalizeOptions({ alternatorChargeAlarm: value }).alternatorChargeAlarm, false);
    }
});

test('alarmas de temperatura y aceite usan las notificaciones reales y se restablecen independientemente', () => {
    let data = {};
    for (const [hot, lowOil] of [[false, false], [true, false], [false, true], [true, true], [false, false]]) {
        const values = createValues(0, { engineOverTemperatureAlarm: hot, engineLowOilPressureAlarm: lowOil });
        for (const [suffix, active] of [['overTemperature', hot], ['lowOilPressure', lowOil]]) {
            const notification = values.find(item => item.path === `notifications.propulsion.0.${suffix}`).value;
            assert.equal(notification.state, active ? 'alarm' : 'normal');
            assert.deepEqual(notification.method, active ? ['visual'] : []);
        }
        data = { ...data, ...readInstrumentDelta({ context: 'vessels.self', updates: [{ values }] }) };
        const navigation = deriveNavigationData(data);
        assert.equal(navigation.waterTemperatureAlarm, hot);
        assert.equal(navigation.oilPressureAlarm, lowOil);
        assert.equal(navigation.alternatorChargeAlarm, false);
        assert.equal(navigation.engineTemperatureCelsius, 85);
        assert.equal(navigation.engineOilPressureBar, 4);
    }
    for (const value of [undefined, null, 'true', 'false', 0, 1]) {
        const config = normalizeOptions({ engineOverTemperatureAlarm: value, engineLowOilPressureAlarm: value });
        assert.equal(config.engineOverTemperatureAlarm, false);
        assert.equal(config.engineLowOilPressureAlarm, false);
    }
    const plugin = createPlugin({ handleMessage() {} });
    assert.equal(plugin.schema.properties.engineOverTemperatureAlarm.type, 'boolean');
    assert.equal(plugin.schema.properties.engineLowOilPressureAlarm.type, 'boolean');
});

test('baja tensión PGN 127489 llega al aviso de batería independientemente del voltaje y alternador', () => {
    let data = {};
    for (const active of [false, true, false]) {
        const values = createValues(0, { lowBatteryAlarm: active, batteryVoltage: 13.8 });
        const notification = values.find(item => item.path === 'notifications.propulsion.0.lowSystemVoltage').value;
        assert.equal(notification.state, active ? 'alarm' : 'normal');
        assert.deepEqual(notification.method, active ? ['visual'] : []);
        data = { ...data, ...readInstrumentDelta({ context: 'vessels.self', updates: [{ values }] }) };
        const navigation = deriveNavigationData(data);
        assert.equal(navigation.lowBatteryAlarm, active);
        assert.equal(navigation.batteryVoltage, 13.8);
        assert.equal(navigation.alternatorChargeAlarm, false);
    }
    for (const value of [undefined, null, 'true', 'false', 0, 1]) {
        assert.equal(normalizeOptions({ lowBatteryAlarm: value }).lowBatteryAlarm, false);
    }
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
