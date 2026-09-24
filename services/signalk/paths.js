/** Catálogo único: cambia aquí las rutas para adaptar la app al barco.
 * Se conservan los paths actuales. Un cambio de número a objeto requiere
 * adaptar también la extracción del valor (por ejemplo navigation.attitude).
 * simulator define ejemplos numéricos; después ejecuta npm run simulator:generate.
 */
export const SIGNALK_FIELDS = {
    position: { path: 'navigation.position', initialValue: null },
    simulatedLatitude: { path: 'simulation.gps.latitude', initialValue: null, simulator: { minValue: 39.4699, maxValue: 39.4699, dataPeriod: 60, outputPeriod: 1 } },
    simulatedLongitude: { path: 'simulation.gps.longitude', initialValue: null, simulator: { minValue: -0.3763, maxValue: -0.3763, dataPeriod: 60, outputPeriod: 1 } },
    apparentWindSpeed: { path: 'environment.wind.speedApparent', initialValue: 0, simulator: { minValue: 2.572222, maxValue: 15.433333, dataPeriod: 60, outputPeriod: 0.5 } },
    windDirection: { "path": "environment.wind.directionTrue", "initialValue": 0, "simulator": { "minValue": 1.396263, "maxValue": 1.745329, "dataPeriod": 60, "outputPeriod": 0.5 } },
    windSpeed: { "path": "environment.wind.speedTrue", "initialValue": 0, "simulator": { "minValue": 5.144444, "maxValue": 10.288889, "dataPeriod": 60, "outputPeriod": 0.5 } },
    speedOverGround: { "path": "navigation.speedOverGround", "initialValue": 0, "simulator": { "minValue": 2.057778, "maxValue": 4.115556, "dataPeriod": 60, "outputPeriod": 0.5 } },
    heading: { "path": "navigation.headingTrue", "initialValue": 0, "simulator": { "minValue": 0.698132, "maxValue": 0.872665, "dataPeriod": 60, "outputPeriod": 0.5 } },
    depth: { "path": "navigation.depthBelowTransducer", "initialValue": 0, "simulator": { "minValue": 8, "maxValue": 16, "dataPeriod": 60, "outputPeriod": 0.5 } },
    currentDrift: { "path": "navigation.current.drift", "initialValue": 0, "simulator": { "minValue": 0.257222, "maxValue": 0.771667, "dataPeriod": 60, "outputPeriod": 0.5 } },
    currentSet: { "path": "navigation.current.setTrue", "initialValue": 0, "simulator": { "minValue": 1.919862, "maxValue": 2.268928, "dataPeriod": 60, "outputPeriod": 0.5 } },
    rudderAngle: { "path": "steering.rudderAngle", "initialValue": 0, "simulator": { "minValue": -0.174533, "maxValue": 0.174533, "dataPeriod": 60, "outputPeriod": 0.5 } },
    engineRevolutions: { "path": "propulsion.0.revolutions", "initialValue": 0, "simulator": { "minValue": 0, "maxValue": 0, "dataPeriod": 60, "outputPeriod": 0.5 } },
    apparentWindAngle: { "path": "environment.wind.angleApparent", "initialValue": 0, "simulator": { "minValue": 0.349066, "maxValue": 0.698132, "dataPeriod": 60, "outputPeriod": 0.5 } },
    autopilotState: { "path": "steering.autopilot.state", "initialValue": "standby" },
    heel: { "path": "vessels.self.navigation.attitude.roll", "initialValue": 0, "simulator": { "minValue": -0.261799, "maxValue": 0.261799, "dataPeriod": 60, "outputPeriod": 0.5 } },
};

// Alternativas históricas usadas por el modelo; no se suscriben actualmente.
export const CURRENT_FALLBACK_PATHS = {
    drift: ['performance.currentDrift', 'ocean.drift'],
    set: ['performance.currentSetTrue', 'ocean.set'],
};

export const SIGNALK_PATHS = Object.fromEntries(
    Object.entries(SIGNALK_FIELDS).map(([name, field]) => [name, field.path])
);

export const INITIAL_DATA = {
    isConnected: false,
    ...Object.fromEntries(Object.values(SIGNALK_FIELDS).map(field => [field.path, field.initialValue])),
};
