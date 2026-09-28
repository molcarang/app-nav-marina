/** Catálogo único: cambia aquí las rutas para adaptar la app al barco.
 * Los paths son relativos a vessels.self; los objetos se extraen en navigationData.
 * simulator define ejemplos numéricos; después ejecuta npm run simulator:generate.
 */
export const SIGNALK_FIELDS = {
    attitude: { path: 'navigation.attitude', initialValue: null },
    current: { path: 'environment.current', initialValue: null },
    headingMagnetic: { path: 'navigation.headingMagnetic', initialValue: null },
    magneticVariation: { path: 'navigation.magneticVariation', initialValue: null },
    courseOverGround: { path: 'navigation.courseOverGroundTrue', initialValue: null },
    trueWindAngle: { path: 'environment.wind.angleTrueWater', initialValue: null },
    position: { path: 'navigation.position', initialValue: null },
    apparentWindSpeed: { path: 'environment.wind.speedApparent', initialValue: null, simulator: { minValue: 2.572222, maxValue: 15.433333, dataPeriod: 60, outputPeriod: 0.5 } },
    windDirection: { "path": "environment.wind.directionTrue", "initialValue": null, "simulator": { "minValue": 1.396263, "maxValue": 1.745329, "dataPeriod": 60, "outputPeriod": 0.5 } },
    windSpeed: { "path": "environment.wind.speedTrue", "initialValue": null, "simulator": { "minValue": 5.144444, "maxValue": 10.288889, "dataPeriod": 60, "outputPeriod": 0.5 } },
    speedOverGround: { "path": "navigation.speedOverGround", "initialValue": null, "simulator": { "minValue": 2.057778, "maxValue": 4.115556, "dataPeriod": 60, "outputPeriod": 0.5 } },
    heading: { "path": "navigation.headingTrue", "initialValue": null, "simulator": { "minValue": 0.698132, "maxValue": 0.872665, "dataPeriod": 60, "outputPeriod": 0.5 } },
    depth: { "path": "environment.depth.belowTransducer", "initialValue": null, "simulator": { "minValue": 8, "maxValue": 16, "dataPeriod": 60, "outputPeriod": 0.5 } },
    currentDrift: { "path": "environment.current.drift", "initialValue": null, "simulator": { "minValue": 0.257222, "maxValue": 0.771667, "dataPeriod": 60, "outputPeriod": 0.5 } },
    currentSet: { "path": "environment.current.setTrue", "initialValue": null, "simulator": { "minValue": 1.919862, "maxValue": 2.268928, "dataPeriod": 60, "outputPeriod": 0.5 } },
    rudderAngle: { "path": "steering.rudderAngle", "initialValue": null, "simulator": { "minValue": -0.174533, "maxValue": 0.174533, "dataPeriod": 60, "outputPeriod": 0.5 } },
    engineRevolutions: { "path": "propulsion.0.revolutions", "initialValue": null, "simulator": { "minValue": 0, "maxValue": 0, "dataPeriod": 60, "outputPeriod": 0.5 } },
    apparentWindAngle: { "path": "environment.wind.angleApparent", "initialValue": null, "simulator": { "minValue": 0.349066, "maxValue": 0.698132, "dataPeriod": 60, "outputPeriod": 0.5 } },
    autopilotState: { "path": "steering.autopilot.state", "initialValue": null },
    heel: { "path": "navigation.attitude.roll", "initialValue": null, "simulator": { "minValue": -0.261799, "maxValue": 0.261799, "dataPeriod": 60, "outputPeriod": 0.5 } },
};

export const SIGNALK_PATHS = Object.fromEntries(
    Object.entries(SIGNALK_FIELDS).map(([name, field]) => [name, field.path])
);

export const INITIAL_DATA = {
    isConnected: false,
    ...Object.fromEntries(Object.values(SIGNALK_FIELDS).map(field => [field.path, field.initialValue])),
};

export const ENGINE_PATH_PATTERN = /^propulsion\.[^.]+\.revolutions$/;
export const SUBSCRIPTION_PATHS = [...new Set([
    ...Object.values(SIGNALK_PATHS).filter(path => !path.startsWith('simulation.')),
    'propulsion.*.revolutions',
    'environment.current.setMagnetic',
])];
export const isInstrumentPath = path => SUBSCRIPTION_PATHS.includes(path) || ENGINE_PATH_PATTERN.test(path);
