import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeEngineConsumptionTable } from '../model/engineConsumptionTable.js';
import { ENGINE_CONSUMPTION_INTERVAL_MS, estimateEngineConsumption } from '../model/engineConsumption.js';

export function useEngineConsumption(rpm, table, connected) {
    const curve = useMemo(() => normalizeEngineConsumptionTable(table), [table]);
    const latestRpm = useRef(rpm);
    const [rate, setRate] = useState(null);
    const canEstimate = connected && Number.isFinite(rpm) && rpm > 0 && curve.length > 0;
    useEffect(() => { latestRpm.current = rpm; }, [rpm]);
    useEffect(() => {
        if (!canEstimate) { setRate(null); return; }
        const calculate = () => setRate(estimateEngineConsumption(latestRpm.current, curve));
        calculate();
        const timer = setInterval(calculate, ENGINE_CONSUMPTION_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [canEstimate, curve]);
    return canEstimate ? rate : null;
}
