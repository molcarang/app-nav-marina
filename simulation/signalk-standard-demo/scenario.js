const fields = require('./fields.json');

const defaults = {
    latitude: 28.73688887633891,
    longitude: -13.8627767277691,
    engineRpm: 0,
    autopilotState: 'standby',
    depthMin: 8,
    depthMax: 16,
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
        autopilotState: ['standby', 'auto', 'wind', 'route'].includes(options.autopilotState)
            ? options.autopilotState : defaults.autopilotState,
        depthMin: Math.min(depthMin, depthMax),
        depthMax: Math.max(depthMin, depthMax),
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
        { path: fields.position.path, value: { latitude: config.latitude, longitude: config.longitude } },
        { path: fields.attitude.path, value: { roll: oscillate(fields.heel), pitch: 0, yaw: oscillate(fields.heading) } },
        { path: fields.current.path, value: { drift: oscillate(fields.currentDrift), setTrue: oscillate(fields.currentSet) } },
        { path: fields.courseOverGround.path, value: oscillate(fields.heading) + 8 * Math.PI / 180 },
        { path: fields.engineRevolutions.path, value: config.engineRpm / 60 },
        { path: fields.autopilotState.path, value: config.autopilotState },
        { path: fields.depth.path, value: oscillate({ ...fields.depth, minValue: config.depthMin, maxValue: config.depthMax }) },
    );
    return values;
}

module.exports = { createValues, normalizeOptions, defaults };
