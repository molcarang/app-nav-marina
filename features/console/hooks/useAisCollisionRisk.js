import { useEffect, useRef, useState } from 'react';
import { calculateAisCollision, stabilizeAisCollision, vesselMotion } from '../model/aisCollisionRisk.js';

export function useAisCollisionRisk(targets, ownData, settings, connected) {
    const [now, setNow] = useState(Date.now);
    const [evaluated, setEvaluated] = useState({});
    const previous = useRef({});
    const previousSettings = useRef(settings);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        if (previousSettings.current !== settings) previous.current = {};
        previousSettings.current = settings;
        const time = Date.now();
        const own = vesselMotion(ownData);
        const results = {};
        for (const [id, target] of Object.entries(targets)) {
            const risk = connected ? calculateAisCollision(own, vesselMotion(target), settings, time)
                : { level: 'unknown', cpaNm: null, tcpaMinutes: null, reason: 'data' };
            results[id] = { ...target, collision: stabilizeAisCollision(previous.current[id]?.collision, risk, time) };
        }
        previous.current = results;
        setEvaluated(results);
    }, [targets, ownData, settings, connected, now]);
    return evaluated;
}
