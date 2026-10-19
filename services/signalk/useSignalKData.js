import { useEffect, useRef, useState } from 'react';
import { INITIAL_DATA } from './config';
import { SIGNALK_PATHS, SUBSCRIPTION_PATHS } from './paths';
import { readInstrumentDelta } from './instrumentDeltas';
import { DEFAULT_SIGNALK_ADDRESS, getSignalKSocketUrl, SIGNALK_RECONNECT_DELAY_MS } from './serverAddress';
import { createPendingUpdates } from './pendingUpdates';
import { monitorSignalKConnection } from './connectionMonitor';

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
        let monitor;
        let self;
        const timestamps = new Map();
        const disconnect = connection => {
            if (!active || socket !== connection) return;
            socket = null;
            monitor?.dispose();
            pending?.dispose();
            timestamps.clear();
            setSignalKData(INITIAL_DATA);
            connection.onopen = connection.onmessage = connection.onerror = connection.onclose = null;
            try { connection.close(); } catch { /* A stalled socket may not complete its close handshake. */ }
            clearTimeout(retry);
            retry = setTimeout(connect, SIGNALK_RECONNECT_DELAY_MS);
        };
        const connect = () => {
            timestamps.clear();
            self = undefined;
            pending = createPendingUpdates(updates => {
                if (active) setSignalKData(previous => ({ ...previous, ...updates }));
            });
            const url = new URL(getSignalKSocketUrl(address));
            url.searchParams.set('subscribe', 'none');
            try { socket = new WebSocket(url.toString()); }
            catch {
                pending.dispose();
                setSignalKData(INITIAL_DATA);
                retry = setTimeout(connect, SIGNALK_RECONNECT_DELAY_MS);
                return;
            }
            const connection = socket;
            monitor = monitorSignalKConnection(connection, () => disconnect(connection), {
                onConfirmed: () => {
                    if (active && socket === connection) setSignalKData(previous => ({ ...previous, isConnected: true }));
                },
            });
            socket.onopen = () => {
                if (!active || socket !== connection) return;
                setSignalKData(INITIAL_DATA);
                monitor.opened();
                if (socket !== connection) return;
                try {
                    connection.send(JSON.stringify({ context: 'vessels.self', subscribe:
                        SUBSCRIPTION_PATHS.map(path => ({ path, period: 500, format: 'delta' })) }));
                } catch { disconnect(connection); }
            };
            socket.onmessage = event => {
                if (!active || socket !== connection) return;
                let message;
                try { message = JSON.parse(event.data); } catch { return; }
                if (!message || typeof message !== 'object' || Array.isArray(message)) return;
                monitor.message(message);
                if (!active || socket !== connection) return;
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
            socket.onerror = socket.onclose = () => disconnect(connection);
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
            monitor?.dispose();
            pending?.dispose();
            if (socket) {
                socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
                socket.close();
            }
        };
    }, [address, enabled]);
    return signalKData;
};
