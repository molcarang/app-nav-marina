import { useEffect, useState } from 'react';
import { projectAisPosition } from '../../../components/gauges/shared/aisProjection.js';

/** Mismos límites de alcance y caducidad que los contactos del gauge. */
export function useVisibleAisCount(targets, position, positionReceivedAt, connected, rangeNm) {
    const [, refresh] = useState(0);
    useEffect(() => {
        if (!connected) return;
        const timer = setInterval(() => refresh(value => value + 1), 1000);
        return () => clearInterval(timer);
    }, [connected]);
    const now = Date.now();
    if (!connected || !Number.isFinite(positionReceivedAt) || now - positionReceivedAt >= 30000) return 0;
    return Object.values(targets).filter(target =>
        Number.isFinite(target.positionReceivedAt) && now - target.positionReceivedAt < 300000
        && projectAisPosition(position, target['navigation.position'], 0, 1, rangeNm)
    ).length;
}
