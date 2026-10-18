import { useEffect, useRef, useState } from 'react';
import { advanceAisRange, suggestedAisRange } from '../../../components/gauges/shared/aisAutoRange.js';

export function useAisAutoRange(enabled, manualRange, data) {
    const latest = useRef(data);
    useEffect(() => { latest.current = data; }, [data]);
    const [state, setState] = useState({ range: manualRange, candidate: null, since: 0 });
    useEffect(() => {
        setState({ range: manualRange, candidate: null, since: 0 });
        if (!enabled) return;
        const tick = () => {
            const now = Date.now();
            const desired = suggestedAisRange(latest.current, now);
            setState(previous => advanceAisRange(previous, desired, now));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [enabled, manualRange]);
    return enabled ? state.range : manualRange;
}
