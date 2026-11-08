import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { ENGINE_CONSUMPTION_INTERVAL_MS } from '../model/engineConsumption.js';
import { createEngineHours, ENGINE_HOURS_KEY, readEngineHours } from '../model/engineHours.js';

let storageWrites = Promise.resolve();
export const EngineHoursContext = createContext({ totalHours: null, ready: false, error: '' });

export function useEngineHours(input, enabled) {
    const latest = useRef(input);
    const controller = useRef(null);
    const foreground = useRef(AppState.currentState === 'active');
    const [state, setState] = useState({ totalHours: null, ready: false, error: '' });
    const { rpm, receivedAt, connected, source, authoritativeHours, authoritativeReceivedAt } = input;
    useEffect(() => {
        latest.current = { rpm, receivedAt, connected, source, authoritativeHours, authoritativeReceivedAt };
        controller.current?.update();
    }, [rpm, receivedAt, connected, source, authoritativeHours, authoritativeReceivedAt]);
    useEffect(() => {
        if (!enabled) return;
        foreground.current = AppState.currentState === 'active';
        let alive = true, accumulator = null, lastSaved = null, writeVersion = 0;
        let appliedAuthoritative = null;
        const commit = (force = false) => {
            if (!accumulator) return;
            const hours = accumulator.hours;
            if (alive) setState(previous => previous.ready && previous.totalHours === hours
                ? previous : { ...previous, ready: true, totalHours: hours });
            if (!force && lastSaved === hours) return;
            lastSaved = hours;
            const version = ++writeVersion;
            storageWrites = storageWrites.then(() => AsyncStorage.setItem(ENGINE_HOURS_KEY,
                JSON.stringify({ schema: 1, hours }))).then(() => {
                if (alive && version === writeVersion) setState(previous => previous.error ? { ...previous, error: '' } : previous);
            }).catch(error => {
                lastSaved = null;
                console.warn('No se pudieron guardar las horas de motor', error);
                if (alive) setState(previous => ({ ...previous, error: 'engineHoursSaveError' }));
            });
        };
        const update = () => {
            const now = Date.now();
            const authoritative = latest.current.authoritativeHours;
            if (Number.isFinite(authoritative) && authoritative >= 0) {
                const version = `${latest.current.source}|${latest.current.authoritativeReceivedAt}|${authoritative}`;
                if (version !== appliedAuthoritative) {
                    accumulator?.replace(authoritative, now);
                    appliedAuthoritative = version;
                }
                accumulator?.pause(now);
            } else {
                appliedAuthoritative = null;
                accumulator?.update({ ...latest.current, active: foreground.current }, now);
            }
            commit();
        };
        const pause = () => { accumulator?.pause(Date.now()); commit(); };
        controller.current = { update };
        async function load() {
            try {
                await storageWrites;
                const saved = await AsyncStorage.getItem(ENGINE_HOURS_KEY);
                if (!alive) return;
                const hours = readEngineHours(saved);
                accumulator = createEngineHours(hours);
                lastSaved = saved === null ? null : hours;
                update();
            } catch (error) {
                console.warn('No se pudieron cargar las horas de motor', error);
                if (alive) setState(previous => ({ ...previous, error: 'engineHoursLoadError' }));
            }
        }
        load();
        const timer = setInterval(() => {
            if (Number.isFinite(latest.current.authoritativeHours)) {
                accumulator?.pause(Date.now());
            } else if (foreground.current) accumulator?.tick(Date.now());
            else accumulator?.pause(Date.now());
            commit();
        }, ENGINE_CONSUMPTION_INTERVAL_MS);
        const subscription = AppState.addEventListener('change', status => {
            foreground.current = status === 'active';
            if (foreground.current) update(); else pause();
        });
        const pagehide = () => { foreground.current = false; pause(); };
        const pageshow = () => { foreground.current = AppState.currentState === 'active'; update(); };
        const events = globalThis.window;
        events?.addEventListener?.('pagehide', pagehide);
        events?.addEventListener?.('pageshow', pageshow);
        return () => {
            alive = false;
            clearInterval(timer);
            subscription.remove();
            events?.removeEventListener?.('pagehide', pagehide);
            events?.removeEventListener?.('pageshow', pageshow);
            pause();
            controller.current = null;
        };
    }, [enabled]);
    return useMemo(() => state, [state]);
}
