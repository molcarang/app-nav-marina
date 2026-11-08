import { useEffect, useRef, useState } from 'react';
import { createDisplayReadings, normalizeDisplayRefreshSeconds } from '../model/displayReadings.js';

/** Presentation only. Callers keep live navigation for alarms, needles and history. */
export function useDisplayReadings(navigation, refreshSeconds) {
    const seconds = normalizeDisplayRefreshSeconds(refreshSeconds);
    const latest = useRef(navigation);
    const sampler = useRef(null);
    const [displayed, setDisplayed] = useState(navigation);
    useEffect(() => {
        latest.current = navigation;
        sampler.current?.push(navigation);
    }, [navigation]);
    useEffect(() => {
        const current = createDisplayReadings(setDisplayed, seconds);
        sampler.current = current;
        current.push(latest.current);
        return () => { current.dispose(); sampler.current = null; };
    }, [seconds]);
    return displayed;
}
