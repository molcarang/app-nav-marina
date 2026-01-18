import { useEffect, useState } from 'react';
/** Máximos de la sesión. El reinicio espera a la siguiente variación de lecturas. */
export function useSessionMaxima(sogKnots, twsKnots) {
    const [maxSOG, setMaxSOG] = useState(0);
    const [maxTWS, setMaxTWS] = useState(0);
    useEffect(() => {
        const sog = parseFloat(sogKnots);
        const tws = parseFloat(twsKnots);
        setMaxSOG(previous => sog > previous ? sog : previous);
        setMaxTWS(previous => tws > previous ? tws : previous);
    }, [sogKnots, twsKnots]);
    return { maxSOG, maxTWS, resetSOG: () => setMaxSOG(0), resetTWS: () => setMaxTWS(0) };
}
