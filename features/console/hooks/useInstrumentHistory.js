import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { appendWindReading as appendReading, pruneHistory, HISTORY_SAMPLE_MS } from '../model/twsHistory.js';

let startupCleanup;

// Una sola limpieza por arranque; girar la pantalla o cambiar de servidor no la repite.
function clearPreviousSession() {
    if (!startupCleanup) {
        startupCleanup = AsyncStorage.getAllKeys().then(keys => {
            const historyKeys = keys.filter(key => key.startsWith('@tws_history_') || key.startsWith('@sog_history_'));
            return historyKeys.length ? AsyncStorage.multiRemove(historyKeys) : undefined;
        });
    }
    return startupCleanup;
}

/** Historial por servidor durante la sesión, vacío al iniciar la aplicación. */
export function useInstrumentHistory(metric, server, enabled, hours = 2) {
    const retention = useRef(hours);
    const controller = useRef(null);
    const [history, setHistory] = useState([]);
    useEffect(() => {
        retention.current = hours;
        controller.current?.trim();
    }, [hours]);

    useEffect(() => {
        if (!enabled) return;
        let active = true;
        let timer;
        let samples = [];
        let writes = Promise.resolve();
        const key = `@${metric}_history_v2:${server}`;
        const persist = () => {
            const serialized = JSON.stringify(samples);
            writes = writes.then(() => AsyncStorage.setItem(key, serialized)).catch(error => {
                console.warn(`No se pudo guardar el historial ${metric}`, error);
            });
        };
        setHistory([]);
        const publish = () => {
            samples = pruneHistory(samples, Date.now(), retention.current);
            setHistory(samples);
            persist();
        };
        let clearedWhileLoading = false;
        controller.current = {
            add: (value, time) => { samples = appendReading(samples, value, time, retention.current); },
            clear: () => { clearedWhileLoading = true; samples = []; setHistory([]); persist(); },
            trim: publish,
        };
        async function start() {
            try {
                await clearPreviousSession();
                if (!active) return;
                const saved = await AsyncStorage.getItem(key);
                if (!active) return;
                const restored = clearedWhileLoading ? [] : pruneHistory(saved ? JSON.parse(saved) : [], Date.now(), retention.current);
                // Las muestras recibidas durante la carga tienen prioridad en su bloque.
                const liveTimes = new Set(samples.map(sample => sample.time));
                samples = [...restored.filter(sample => !liveTimes.has(sample.time)), ...samples].sort((a, b) => a.time - b.time);
            } catch (error) { console.warn(`No se pudo cargar el historial ${metric}`, error); }
            if (!active) return;
            publish();
            timer = setInterval(publish, HISTORY_SAMPLE_MS);
        }
        start();
        return () => { active = false; clearInterval(timer); controller.current = null; };
    }, [metric, server, enabled]);
    const clearHistory = useCallback(() => controller.current?.clear(), []);
    const recordReading = useCallback((value, time) => controller.current?.add(value, time), []);
    return { history, clearHistory, recordReading };
}
