import { useCallback, useEffect, useState } from 'react';
import { useAlarmSound } from './useAlarmSound';
import { aisAlertSnapshot, hasNewAisAlert, reconcileAisAcknowledgement } from '../model/aisAlertState.js';

/** Acknowledge current alerts; only new vessels or escalation rearm audio. */
export function useAisCollisionAlarm(targets) {
    const alerts = aisAlertSnapshot(targets);
    const level = alerts.some(([, risk]) => risk === 'danger') ? 'danger' : alerts.length ? 'warning' : null;
    const active = level !== null;
    const alarmKey = JSON.stringify(alerts);
    const [mutedFor, setMutedFor] = useState(null);
    const muted = active && !hasNewAisAlert(mutedFor, alerts);
    useEffect(() => {
        const current = JSON.parse(alarmKey);
        setMutedFor(previous => reconcileAisAcknowledgement(previous, current));
    }, [alarmKey]);
    const toggleMute = useCallback(() => {
        if (active) setMutedFor(muted ? null : Object.fromEntries(JSON.parse(alarmKey)));
    }, [active, muted, alarmKey]);
    useAlarmSound(level === 'warning' && !muted, require('../../../assets/sounds/ais-warning-alarm.wav'));
    useAlarmSound(level === 'danger' && !muted, require('../../../assets/sounds/ais-danger-alarm.wav'));
    return { level, muted, toggleMute };
}
