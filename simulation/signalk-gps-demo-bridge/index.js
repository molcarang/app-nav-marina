// Puente de pruebas: el simulador numérico publica las coordenadas por separado.
// OpenCPN necesita un único objeto navigation.position del barco propio.
module.exports = function (app) {
    let timer;
    const plugin = {
        id: 'signalk-gps-demo-bridge',
        name: 'GPS Demo - posicion para OpenCPN',
        description: 'Convierte simulation.gps a navigation.position. Solo para pruebas.',
        schema: { type: 'object', properties: {} },
        start() {
            plugin.stop();
            const publish = () => {
                const lat = app.getSelfPath('simulation.gps.latitude');
                const lon = app.getSelfPath('simulation.gps.longitude');
                const latitude = lat?.value;
                const longitude = lon?.value;
                if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
                    !Number.isFinite(longitude) || Math.abs(longitude) > 180) return;

                // No renovar artificialmente la posición si se detiene el simulador.
                const times = [Date.parse(lat.timestamp), Date.parse(lon.timestamp)];
                if (times.some(time => !Number.isFinite(time) ||
                    Date.now() - time > 10000 || time > Date.now() + 1000)) return;
                app.handleMessage(plugin.id, {
                    context: 'vessels.self',
                    updates: [{
                        source: { label: plugin.id },
                        timestamp: new Date(Math.min(...times)).toISOString(),
                        values: [{ path: 'navigation.position', value: { latitude, longitude } }],
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
