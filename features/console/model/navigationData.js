import { mpsToKnots, normalizeAngle, radToDeg } from '../../../utils/Utils.js';
import { SIGNALK_PATHS as P, ENGINE_PATH_PATTERN } from '../../../services/signalk/paths.js';
import { isValidPosition } from './gpsPosition.js';

const number = value => Number.isFinite(value) ? value : null;
const positive = value => Number.isFinite(value) && value >= 0 ? value : null;
const degrees = value => value === null ? null : radToDeg(value);
const bearing = value => value === null ? null : ((radToDeg(value) % 360) + 360) % 360;
const knots = value => value === null ? '—' : mpsToKnots(value);

/** Objetos y unidades de Signal K. Ausencia de datos distinta de cero. */
export function deriveNavigationData(data) {
    const position = isValidPosition(data[P.position]) ? data[P.position] : null;
    const variation = number(data[P.magneticVariation]);
    const magnetic = number(data[P.headingMagnetic]);
    const heading = number(data[P.heading]) ?? (magnetic !== null && variation !== null ? magnetic + variation : null);
    const headingDeg = bearing(heading);
    const cog = bearing(number(data[P.courseOverGround]));
    const current = data[P.current];
    const drift = positive(current?.drift ?? data[P.currentDrift]);
    const set = number(current?.setTrue ?? data[P.currentSet]) ??
        (Number.isFinite(current?.setMagnetic ?? data['environment.current.setMagnetic']) && variation !== null ? (current?.setMagnetic ?? data['environment.current.setMagnetic']) + variation : null);
    const tws = positive(data[P.windSpeed]);
    const twd = number(data[P.windDirection]);
    const twaRad = number(data[P.trueWindAngle]) ?? (twd !== null && heading !== null ? twd - heading : null);
    const twa = twaRad === null ? null : normalizeAngle(radToDeg(twaRad));
    const awaRad = number(data[P.apparentWindAngle]);
    const awa = awaRad === null ? null : normalizeAngle(radToDeg(awaRad));
    const engines = Object.entries(data).filter(([path, value]) => ENGINE_PATH_PATTERN.test(path) && positive(value) !== null);
    const engineRpm = engines.length ? Math.max(...engines.map(([, value]) => value * 60)) : null;
    const rudder = degrees(number(data[P.rudderAngle]));
    return {
        position,
        positionReceivedAt: position ? data.positionReceivedAt ?? null : null,
        driftKnots: drift !== null && set !== null && heading !== null ? drift * 1.94384 : null,
        setDeg: bearing(set),
        headingDeg,
        headingDigital: headingDeg === null ? '—' : headingDeg.toFixed(1),
        cogDeg: cog,
        cogDigital: cog === null ? '—' : cog.toFixed(1),
        cogSquare: cog === null ? '—' : cog.toFixed(0) + '°',
        twsKnots: knots(tws),
        awsKnots: positive(data[P.apparentWindSpeed]) === null ? 0 : Number(mpsToKnots(data[P.apparentWindSpeed])),
        twdDeg: bearing(twd),
        twdDigital: twd === null ? '—' : bearing(twd).toFixed(0) + '°',
        twaCog: twa === null ? null : -twa,
        twa,
        sogKnots: knots(positive(data[P.speedOverGround])),
        depthMeters: positive(data[P.depth]),
        rudderAngle: rudder === null ? null : Math.round(rudder),
        engineRpm,
        navigationMode: engineRpm === null ? null : engineRpm > 0 ? 'ENGINE' : 'SAIL',
        awa,
        awaFixed: awa === null ? '—' : Math.abs(awa).toFixed(0),
        awaDigital: awa === null ? 'AWA' : `AWA (${awa < 0 ? 'P' : 'S'})`,
        apState: data[P.autopilotState] ?? null,
        vesselHeelDeg: degrees(number(data[P.attitude]?.roll ?? data[P.heel])),
    };
}
/** Proyección respecto al viento utilizada por VMG y VMC. */
export function derivePerformance(navigation, maxSOG, minWindAngle) {
    const vmc = navigation.sogKnots * Math.cos(navigation.twaCog * Math.PI / 180);
    return { vmc, vmg: Math.abs(vmc), targetVMG: maxSOG * Math.cos(minWindAngle * Math.PI / 180) };
}
