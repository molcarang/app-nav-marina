import { mpsToKnots, normalizeAngle, radToDeg } from '../../../utils/Utils.js';
import { SIGNALK_PATHS } from '../../../services/signalk/paths.js';
/** Convierte datos crudos para la consola; conserva las fórmulas existentes. */
export function deriveNavigationData(data) {
    // Corriente (Set & Drift)
    const rawDrift = data['navigation.current.drift'] ?? data['performance.currentDrift'] ?? data['ocean.drift'] ?? 0;
    const rawSet = data['navigation.current.setTrue'] ?? data['performance.currentSetTrue'] ?? data['ocean.set'] ?? 0;
    const rawRudderAngle = data['steering.rudderAngle'] ?? 0;
    // Navegación (COG)
    const headingRad = data['navigation.headingTrue'] ?? 0;
    const headingDeg = radToDeg(headingRad);
    // Viento (TWS & TWD)
    const twsMps = data['environment.wind.speedTrue'] ?? 0;
    const twdRad = data['environment.wind.directionTrue'] ?? 0;
    const twdDeg = radToDeg(twdRad);
    const depth = data['navigation.depthBelowTransducer'] ?? 0;
    const engineRpm = data['propulsion.0.revolutions'] ?? 0;
    const awaRad = data['environment.wind.angleApparent'] ?? 0;
    const awaDeg = radToDeg(awaRad);
    const awaFixed = Math.abs(normalizeAngle(awaDeg)).toFixed(0);
    const awaSide = normalizeAngle(awaDeg) < 0 ? 'P' : 'S';
    const apState = data['steering.autopilot.state'];
    const vesselHeelRad = data['vessels.self.navigation.attitude.roll'] ?? 0;
    return {
        driftKnots: rawDrift * 1.94384,
        setDeg: radToDeg(rawSet),
        cogDeg: headingDeg, // Para compatibilidad con componentes existentes
        cogDigital: headingDeg.toFixed(1),
        cogSquare: headingDeg.toFixed(0) + '°',
        twsKnots: mpsToKnots(twsMps),
        awsKnots: Number(mpsToKnots(data[SIGNALK_PATHS.apparentWindSpeed] ?? 0)),
        twdDeg: twdDeg,
        twdDigital: !isNaN(twdDeg) ? Math.abs(normalizeAngle(twdDeg)).toFixed(0) + '°' : '---',
        twaCog: !isNaN(twdDeg) ? normalizeAngle(headingDeg - twdDeg) : null, // TWA respecto a proa (signed, COG)
        twa: !isNaN(twdDeg) ? -normalizeAngle(headingDeg - twdDeg) : null, // TWA con signo (positivo = estribor, negativo = babor)
        sogKnots: mpsToKnots(data['navigation.speedOverGround'] ?? 0),
        depthMeters: depth,
        rudderAngle: Math.round(rawRudderAngle * (180 / Math.PI)),
        engineRpm: engineRpm * 60,
        navigationMode: ((engineRpm * 60) > 666661 ? 'ENGINE' : 'SAIL'),
        awa: normalizeAngle(awaDeg),
        awaFixed: awaFixed,
        awaDigital: 'AWA (' + awaSide + ')',
        apState: apState,
        vesselHeelDeg: radToDeg(vesselHeelRad)
    };
}
/** Proyección respecto al viento utilizada por VMG y VMC. */
export function derivePerformance(navigation, maxSOG, minWindAngle) {
    const vmc = navigation.sogKnots * Math.cos(navigation.twaCog * Math.PI / 180);
    return { vmc, vmg: Math.abs(vmc), targetVMG: maxSOG * Math.cos(minWindAngle * Math.PI / 180) };
}
