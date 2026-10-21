const fields = require('./fields.json');

const defaults = {
    latitude: 28.73688887633891,
    longitude: -13.8627767277691,
    engineRpm: 0,
    engineTemperatureCelsius: 85,
    engineOilPressureBar: 4,
    fuelLevelPercent: 75,
    batteryVoltage: 13.8,
    alternatorChargeAlarm: false,
    engineOverTemperatureAlarm: false,
    engineLowOilPressureAlarm: false,
    lowBatteryAlarm: false,
    autopilotState: 'standby',
    depthMin: 8,
    depthMax: 16,
    waterTemperatureCelsius: 22,
};

function bounded(value, fallback, min, max) {
    return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function normalizeOptions(options = {}) {
    const depthMin = bounded(options.depthMin, defaults.depthMin, 0, 1000);
    const depthMax = bounded(options.depthMax, defaults.depthMax, 0, 1000);
    return {
        latitude: bounded(options.latitude, defaults.latitude, -90, 90),
        longitude: bounded(options.longitude, defaults.longitude, -180, 180),
        engineRpm: bounded(options.engineRpm, defaults.engineRpm, 0, 10000),
        engineTemperatureCelsius: bounded(options.engineTemperatureCelsius, defaults.engineTemperatureCelsius, -5, 150),
        engineOilPressureBar: bounded(options.engineOilPressureBar, defaults.engineOilPressureBar, 0, 10),
        fuelLevelPercent: bounded(options.fuelLevelPercent, defaults.fuelLevelPercent, 0, 100),
        batteryVoltage: bounded(options.batteryVoltage, defaults.batteryVoltage, 0, 32),
        alternatorChargeAlarm: typeof options.alternatorChargeAlarm === 'boolean'
            ? options.alternatorChargeAlarm : defaults.alternatorChargeAlarm,
        engineOverTemperatureAlarm: typeof options.engineOverTemperatureAlarm === 'boolean'
            ? options.engineOverTemperatureAlarm : defaults.engineOverTemperatureAlarm,
        engineLowOilPressureAlarm: typeof options.engineLowOilPressureAlarm === 'boolean'
            ? options.engineLowOilPressureAlarm : defaults.engineLowOilPressureAlarm,
        lowBatteryAlarm: typeof options.lowBatteryAlarm === 'boolean'
            ? options.lowBatteryAlarm : defaults.lowBatteryAlarm,
        autopilotState: ['standby', 'auto', 'wind', 'route'].includes(options.autopilotState)
            ? options.autopilotState : defaults.autopilotState,
        depthMin: Math.min(depthMin, depthMax),
        depthMax: Math.max(depthMin, depthMax),
        waterTemperatureCelsius: bounded(options.waterTemperatureCelsius, defaults.waterTemperatureCelsius, -5, 50),
    };
}

/** Banco de pruebas visual: posición fija junto a los contactos AIS existentes.
 * SOG/COG son lecturas sintéticas; no se integra una trayectoria geográfica.
 */
function createValues(elapsedSeconds, options = {}) {
    const config = normalizeOptions(options);
    const oscillate = field => field.minValue + (field.maxValue - field.minValue) *
        (0.5 + 0.5 * Math.sin(elapsedSeconds * 2 * Math.PI / field.dataPeriod));
    const values = [];
    const grouped = new Set(['heel', 'currentDrift', 'currentSet', 'engineRevolutions', 'depth']);
    for (const [name, field] of Object.entries(fields)) {
        if (Number.isFinite(field.minValue) && !grouped.has(name)) {
            values.push({ path: field.path, value: oscillate(field) });
        }
    }
    values.push(
        { path: fields.waterTemperature.path, value: config.waterTemperatureCelsius + 273.15 },
        { path: fields.position.path, value: { latitude: config.latitude, longitude: config.longitude } },
        { path: fields.attitude.path, value: { roll: oscillate(fields.heel), pitch: 0, yaw: oscillate(fields.heading) } },
        { path: fields.current.path, value: { drift: oscillate(fields.currentDrift), setTrue: oscillate(fields.currentSet) } },
        { path: fields.courseOverGround.path, value: oscillate(fields.heading) + 8 * Math.PI / 180 },
        { path: fields.engineRevolutions.path, value: config.engineRpm / 60 },
        { path: fields.engineTemperature.path, value: config.engineTemperatureCelsius + 273.15 },
        { path: fields.engineOilPressure.path, value: config.engineOilPressureBar * 100000 },
        { path: fields.fuelLevel.path, value: config.fuelLevelPercent / 100 },
        { path: fields.batteryVoltage.path, value: config.batteryVoltage },
        // PGN 127489, Discrete Status 1, bits 1 and 2, translated to Signal K.
        { path: 'notifications.propulsion.0.overTemperature', value: {
            state: config.engineOverTemperatureAlarm ? 'alarm' : 'normal',
            method: config.engineOverTemperatureAlarm ? ['visual'] : [],
            message: config.engineOverTemperatureAlarm ? 'Temperatura alta del refrigerante del motor'
                : 'Temperatura del refrigerante del motor normal',
        } },
        { path: 'notifications.propulsion.0.lowOilPressure', value: {
            state: config.engineLowOilPressureAlarm ? 'alarm' : 'normal',
            method: config.engineLowOilPressureAlarm ? ['visual'] : [],
            message: config.engineLowOilPressureAlarm ? 'Presión de aceite del motor baja'
                : 'Presión de aceite del motor normal',
        } },
        // PGN 127489 also exposes the explicit low-system-voltage warning (bit 5).
        { path: 'notifications.propulsion.0.lowSystemVoltage', value: {
            state: config.lowBatteryAlarm ? 'alarm' : 'normal',
            method: config.lowBatteryAlarm ? ['visual'] : [],
            message: config.lowBatteryAlarm ? 'Tensión baja del sistema eléctrico del motor'
                : 'Tensión del sistema eléctrico del motor normal',
        } },
        // Equivalent to PGN 127489, Discrete Status 1, bit 9 (Charge Indicator).
        { path: 'notifications.propulsion.0.chargeIndicator', value: {
            state: config.alternatorChargeAlarm ? 'alarm' : 'normal',
            method: config.alternatorChargeAlarm ? ['visual'] : [],
            message: config.alternatorChargeAlarm ? 'Testigo de carga del alternador encendido'
                : 'Testigo de carga del alternador apagado',
        } },
        { path: fields.autopilotState.path, value: config.autopilotState },
        { path: fields.depth.path, value: oscillate({ ...fields.depth, minValue: config.depthMin, maxValue: config.depthMax }) },
    );
    return values;
}

module.exports = { createValues, normalizeOptions, defaults };
