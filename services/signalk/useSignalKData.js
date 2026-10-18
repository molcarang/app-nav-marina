import { useEffect, useRef, useState } from 'react';
import { INITIAL_DATA } from './config';
import { SIGNALK_PATHS, SUBSCRIPTION_PATHS } from './paths';
import { readInstrumentDelta } from './instrumentDeltas';
import { DEFAULT_SIGNALK_ADDRESS, getSignalKSocketUrl, SIGNALK_RECONNECT_DELAY_MS } from './serverAddress';
import { createPendingUpdates } from './pendingUpdates';

/** Suscripción estándar: reconecta y caduca lecturas tras 30 segundos sin actualizar. */
export const useSignalKData = (address = DEFAULT_SIGNALK_ADDRESS, enabled = true, onWindReading, onSogReading) => {
    const sogListener = useRef(onSogReading);
    useEffect(() => { sogListener.current = onSogReading; }, [onSogReading]);
    const windListener = useRef(onWindReading);
    useEffect(() => { windListener.current = onWindReading; }, [onWindReading]);
    const [signalKData, setSignalKData] = useState(INITIAL_DATA);
    useEffect(() => {
        setSignalKData(INITIAL_DATA);
        if (!enabled) return;
        let active = true;
        let socket;
        let retry;
        let pending;
        let self;
        const timestamps = new Map();
        const connect = () => {
            timestamps.clear();
            pending = createPendingUpdates(updates => {
                if (active) setSignalKData(previous => ({ ...previous, ...updates }));
            });
            const url = new URL(getSignalKSocketUrl(address));
            url.searchParams.set('subscribe', 'none');
            socket = new WebSocket(url.toString());
            socket.onopen = () => {
                if (!active) return;
                setSignalKData({ ...INITIAL_DATA, isConnected: true });
                socket.send(JSON.stringify({ context: 'vessels.self', subscribe:
                    SUBSCRIPTION_PATHS.map(path => ({ path, period: 500, format: 'delta' })) }));
            };
            socket.onmessage = event => {
                if (!active) return;
                let message;
                try { message = JSON.parse(event.data); } catch { return; }
                if (typeof message.self === 'string') self = message.self.startsWith('vessels.') ? message.self : `vessels.${message.self}`;
                if (!Array.isArray(message.updates)) return;
                const now = Date.now();
                const updates = readInstrumentDelta(message, self, now);
                for (const path of Object.keys(updates)) if (path !== 'positionReceivedAt') timestamps.set(path, now);
                const wind = updates[SIGNALK_PATHS.windSpeed];
                if (Number.isFinite(wind) && wind >= 0) windListener.current?.(wind * 1.94384, now);
                const sog = updates[SIGNALK_PATHS.speedOverGround];
                if (Number.isFinite(sog) && sog >= 0) sogListener.current?.(sog * 1.94384, now);
                if (Object.keys(updates).length) pending.add(updates);
            };
            socket.onerror = () => { if (active) socket.close(); };
            socket.onclose = () => {
                if (!active) return;
                pending.dispose();
                timestamps.clear();
                setSignalKData(INITIAL_DATA);
                clearTimeout(retry);
                retry = setTimeout(connect, SIGNALK_RECONNECT_DELAY_MS);
            };
        };
        connect();
        const expiry = setInterval(() => {
            const expired = {};
            for (const [path, time] of timestamps) {
                if (Date.now() - time > 30000) {
                    expired[path] = null;
                    timestamps.delete(path);
                }
            }
            if (Object.keys(expired).length) pending.add(expired);
        }, 1000);
        return () => {
            active = false;
            clearTimeout(retry);
            clearInterval(expiry);
            pending.dispose();
            socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
            socket.close();
        };
    }, [address, enabled]);
    return signalKData;
};
