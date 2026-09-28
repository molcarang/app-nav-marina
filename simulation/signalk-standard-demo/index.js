const { createValues, normalizeOptions, defaults } = require('./scenario');

module.exports = function (app) {
    let timer;
    const plugin = {
        id: 'signalk-standard-demo',
        name: 'Standard Demo - instrumentos Signal K',
        description: 'Datos de prueba estándar. Desactiva el simulador numérico y el puente GPS antes de activarlo.',
        schema: {
            type: 'object',
            properties: {
                latitude: { type: 'number', title: 'Latitud fija', default: defaults.latitude, minimum: -90, maximum: 90 },
                longitude: { type: 'number', title: 'Longitud fija', default: defaults.longitude, minimum: -180, maximum: 180 },
                engineRpm: { type: 'number', title: 'Motor (RPM; 0 = parado)', default: 0, minimum: 0, maximum: 10000 },
                autopilotState: { type: 'string', title: 'Estado simulado del piloto', default: 'standby', enum: ['standby', 'auto', 'wind', 'route'] },
                depthMin: { type: 'number', title: 'Profundidad mínima (m)', default: 8, minimum: 0, maximum: 1000 },
                depthMax: { type: 'number', title: 'Profundidad máxima (m)', default: 16, minimum: 0, maximum: 1000 },
            },
        },
        start(options) {
            plugin.stop();
            const config = normalizeOptions(options);
            const startedAt = Date.now();
            const publish = () => {
                const now = Date.now();
                app.handleMessage(plugin.id, {
                    context: 'vessels.self',
                    updates: [{
                        source: { label: plugin.id },
                        timestamp: new Date(now).toISOString(),
                        values: createValues((now - startedAt) / 1000, config),
                    }],
                });
            };
            publish();
            timer = setInterval(publish, 1000);
        },
        stop() {
            clearInterval(timer);
            timer = undefined;
        },
    };
    return plugin;
};
