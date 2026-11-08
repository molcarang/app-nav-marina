import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ENGINE_CONSUMPTION_INTERVAL_MS } from '../model/engineConsumption.js';
import { createEngineConsumptionTotal, ENGINE_CONSUMPTION_TOTAL_KEY, readEngineConsumptionTotal } from '../model/engineConsumptionTotal.js';

let storageWrites = Promise.resolve();
export const EngineConsumptionTotalContext = createContext({ totalLitres: null, ready: false, error: '', resetTotal: () => {} });

export function useEngineConsumptionTotal(input, enabled) {
    const latest = useRef(input);
    const controller = useRef(null);
    const foreground = useRef(AppState.currentState === 'active');
    const [state, setState] = useState({ totalLitres: null, ready: false, error: '' });
    const { rate, rpm, receivedAt, connected, source } = input;
    useEffect(() => {
        latest.current = { rate, rpm, receivedAt, connected, source };
        controller.current?.update();
    }, [rate, rpm, receivedAt, connected, source]);
    useEffect(() => {
        if (!enabled) return;
        foreground.current = AppState.currentState === 'active';
        let alive = true, accumulator = null, lastSaved = null, writeVersion = 0;
        const commit = (force = false) => {
            if (!accumulator) return;
            const litres = accumulator.litres;
            if (alive) setState(previous => previous.ready && previous.totalLitres === litres
                ? previous : { ...previous, ready: true, totalLitres: litres });
            if (!force && lastSaved === litres) return;
            lastSaved = litres;
            const version = ++writeVersion;
            const serialized = JSON.stringify({ schema: 1, litres });
            storageWrites = storageWrites.then(() => AsyncStorage.setItem(ENGINE_CONSUMPTION_TOTAL_KEY, serialized))
                .then(() => {
                    if (alive && version === writeVersion) setState(previous => previous.error ? { ...previous, error: '' } : previous);
                }).catch(error => {
                    lastSaved = null;
                    console.warn('No se pudo guardar el consumo acumulado', error);
                    if (alive) setState(previous => ({ ...previous, error: 'engineConsumptionTotalSaveError' }));
                });
        };
        const update = () => {
            accumulator?.update({ ...latest.current, active: foreground.current }, Date.now());
            commit();
        };
        const pause = () => { accumulator?.pause(Date.now()); commit(); };
        controller.current = { update, reset: () => { accumulator?.reset(Date.now()); commit(true); } };
        async function load() {
            try {
                await storageWrites;
                const saved = await AsyncStorage.getItem(ENGINE_CONSUMPTION_TOTAL_KEY);
                if (!alive) return;
                const litres = readEngineConsumptionTotal(saved);
                accumulator = createEngineConsumptionTotal(litres);
                lastSaved = saved === null ? null : litres;
                update();
            } catch (error) {
                console.warn('No se pudo cargar el consumo acumulado', error);
                if (alive) setState(previous => ({ ...previous, error: 'engineConsumptionTotalLoadError' }));
            }
        }
        load();
        const timer = setInterval(() => {
            if (foreground.current) accumulator?.tick(Date.now());
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
    const resetTotal = useCallback(() => controller.current?.reset(), []);
    return useMemo(() => ({ ...state, resetTotal }), [state, resetTotal]);
}
