/* A removable browser/Node fixture. Not imported by the application. */
(function (root) {
    const SELF = 'vessels.urn:mrn:signalk:uuid:temporary-ais-preview';
    const A = 'vessels.urn:mrn:imo:mmsi:990000001';
    const B = 'vessels.urn:mrn:imo:mmsi:990000002';
    const METADATA = {
        [SELF]: { name: 'SIM · BARCO PROPIO' },
        [A]: { name: 'SIM · ALFA', mmsi: '990000001' },
        [B]: { name: 'SIM · BRAVO', mmsi: '990000002' },
    };
    function position(east, north) {
        return { latitude: 28.75 + north / 6371000 * 180 / Math.PI,
            longitude: -13.84 + east / (6371000 * Math.cos(28.75 * Math.PI / 180)) * 180 / Math.PI };
    }
    function messages({ level = 'none', second = false, elapsedSeconds = 0 }, now = Date.now()) {
        const time = Math.max(0, elapsedSeconds);
        const packet = (context, values) => ({ context, updates: [{ timestamp: new Date(now).toISOString(),
            source: { label: 'temporary-ais-preview' }, values: Object.entries(values).map(([path, value]) => ({ path, value })) }] });
        return [
            packet(SELF, {
                '': METADATA[SELF], 'navigation.position': position(0, 5 * time),
                'navigation.courseOverGroundTrue': 0, 'navigation.headingTrue': 0, 'navigation.speedOverGround': 5,
                'environment.depth.belowTransducer': 12, 'environment.water.temperature': 295.15,
                'environment.wind.angleApparent': 0.7, 'environment.wind.speedApparent': 7,
                'environment.wind.angleTrueWater': 0.5, 'environment.wind.speedTrue': 5,
            }),
            packet(A, {
                '': METADATA[A],
                'navigation.position': level === 'none' ? null : level === 'danger'
                    ? position(0, 1852 - 5 * time) : position(0.3 * 1852, 3000),
                'navigation.courseOverGroundTrue': Math.PI,
                'navigation.speedOverGround': level === 'danger' ? 5 : 0,
            }),
            packet(B, { '': METADATA[B], 'navigation.position': second ? position(-0.35 * 1852, 3200) : null,
                'navigation.courseOverGroundTrue': 0, 'navigation.speedOverGround': 0 }),
        ];
    }
    const api = { SELF, A, B, METADATA, messages };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.AISCollisionSimulation = api;
})(globalThis);
