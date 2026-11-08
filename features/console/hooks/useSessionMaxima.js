import { useEffect, useState } from 'react';
/** Máximos de la sesión. El reinicio espera a la siguiente variación de lecturas. */
export function useSessionMaxima(sogKnots, twsKnots, heelDegrees) {
    const [maxSOG, setMaxSOG] = useState(0);
    const [maxTWS, setMaxTWS] = useState(0);
    const [maxHeelReading, setMaxHeelReading] = useState(null);
    useEffect(() => {
        const sog = parseFloat(sogKnots);
        const tws = parseFloat(twsKnots);
        setMaxSOG(previous => sog > previous ? sog : previous);
        setMaxTWS(previous => tws > previous ? tws : previous);
    }, [sogKnots, twsKnots]);
    useEffect(() => {
        if (Number.isFinite(heelDegrees)) {
            setMaxHeelReading(previous => previous === null || Math.abs(heelDegrees) > Math.abs(previous) ? heelDegrees : previous);
        }
    }, [heelDegrees]);
    const maxHeel = maxHeelReading === null ? null : Math.abs(maxHeelReading);
    const maxHeelSide = maxHeelReading < 0 ? 'port' : maxHeelReading > 0 ? 'starboard' : null;
    return { maxSOG, maxTWS, maxHeel, maxHeelSide, resetSOG: () => setMaxSOG(0), resetTWS: () => setMaxTWS(0), resetHeel: () => setMaxHeelReading(0) };
}
