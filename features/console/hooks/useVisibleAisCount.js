import { useEffect, useState } from 'react';
import { visibleAisContacts } from '../model/aisContacts';

/** Mismos límites de alcance y caducidad que los contactos del gauge. */
export function useVisibleAisCount(targets, position, positionReceivedAt, connected, rangeNm) {
    const [, refresh] = useState(0);
    useEffect(() => {
        if (!connected) return;
        const timer = setInterval(() => refresh(value => value + 1), 1000);
        return () => clearInterval(timer);
    }, [connected]);
    return visibleAisContacts(targets, position, positionReceivedAt, connected, rangeNm).length;
}
