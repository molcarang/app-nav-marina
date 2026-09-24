const boats = require('./boats.json');

// Escenario fijo: conserva las posiciones, velocidades y rumbos del fichero original.
module.exports = function (app) {
    let timer;
    const plugin = {
        id: 'signalk-ais-demo',
        name: 'AIS Demo - cuatro barcos simulados',
        description: 'Publica contactos de prueba independientes del barco propio.',
        schema: { type: 'object', properties: {} },
        start() {
            plugin.stop();
            const publish = () => {
                for (const boat of boats) {
                    app.handleMessage(plugin.id, {
                        context: `vessels.urn:mrn:imo:mmsi:${boat.mmsi}`,
                        updates: [{
                            source: { label: plugin.id },
                            timestamp: new Date().toISOString(),
                            values: [
                                { path: '', value: { name: boat.name, mmsi: boat.mmsi } },
                                { path: 'navigation.position', value: boat.position },
                                { path: 'navigation.speedOverGround', value: boat.speedOverGround },
                                { path: 'navigation.courseOverGroundTrue', value: boat.courseOverGroundTrue },
                            ],
                        }],
                    });
                }
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
