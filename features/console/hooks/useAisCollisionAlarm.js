import { useCallback, useEffect, useState } from 'react';
import { useAlarmSound } from './useAlarmSound';
import { aisAlertSnapshot, hasNewAisAlert } from '../model/aisAlertState.js';

/** Keep the zones captured when muting until a new vessel or a closer zone rearms audio. */
export function useAisCollisionAlarm(targets, enabled = true) {
    const alerts = enabled ? aisAlertSnapshot(targets) : [];
    const level = alerts.some(([, risk]) => risk === 'danger') ? 'danger' : alerts.length ? 'warning' : null;
    const active = level !== null;
    const alarmKey = JSON.stringify(alerts);
    const [mutedFor, setMutedFor] = useState(null);
    const muted = enabled && mutedFor !== null && !hasNewAisAlert(mutedFor, alerts);
    useEffect(() => {
        const current = JSON.parse(alarmKey);
        // Leaving a zone must not replace the reference captured by the mute button.
        setMutedFor(previous => !enabled || hasNewAisAlert(previous, current) ? null : previous);
    }, [alarmKey, enabled]);
    const toggleMute = useCallback(() => {
        if (muted) setMutedFor(null);
        else if (active) setMutedFor(Object.fromEntries(JSON.parse(alarmKey)));
    }, [active, muted, alarmKey]);
    useAlarmSound(level === 'warning' && !muted, require('../../../assets/sounds/ais-warning-alarm.wav'));
    useAlarmSound(level === 'danger' && !muted, require('../../../assets/sounds/ais-danger-alarm.wav'));
    return { level, muted, toggleMute };
}
