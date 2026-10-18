import { useEffect, useState } from 'react';
import { getSignalKSocketUrl, SIGNALK_RECONNECT_DELAY_MS } from './serverAddress';
import { deriveWaypoint, mergeWaypointDelta, mergeWaypointSnapshot, WAYPOINT_BRANCHES, WAYPOINT_SUBSCRIPTIONS } from './waypointData';

/** Receptor de navegación independiente; únicamente lee del servidor. */
export function useWaypointData(address, enabled, position) {
    const [state, setState] = useState({ connected: false, branches: {} });
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        setState({ connected: false, branches: {} });
        if (!enabled) return;
        let disposed = false;
        let socket;
        let retry;
        let self;
        let snapshotController;
        const connect = () => {
            snapshotController?.abort();
            const url = new URL(getSignalKSocketUrl(address));
            url.searchParams.set('subscribe', 'none');
            socket = new WebSocket(url.toString());
            const connection = socket;
            socket.onopen = () => {
                if (disposed) return;
                setState({ connected: true, branches: {} });
                socket.send(JSON.stringify({ context: 'vessels.self', subscribe:
                    WAYPOINT_SUBSCRIPTIONS.map(path => ({ path, period: 500, format: 'delta' })) }));
                // La suscripción solo garantiza deltas futuros; recuperar también el destino existente.
                const controller = new AbortController();
                snapshotController = controller;
                const timeout = setTimeout(() => controller.abort(), 5000);
                Promise.allSettled(WAYPOINT_BRANCHES.map(async branch => {
                    const endpoint = new URL(url.toString());
                    endpoint.protocol = endpoint.protocol === 'wss:' ? 'https:' : 'http:';
                    endpoint.pathname = endpoint.pathname.replace(/\/signalk\/v1\/stream\/?$/, '') +
                        `/signalk/v1/api/vessels/self/${branch.replaceAll('.', '/')}`;
                    endpoint.search = '';
                    const response = await fetch(endpoint.toString(), { signal: controller.signal });
                    if (!response.ok) return;
                    const snapshot = await response.json();
                    if (disposed || controller.signal.aborted || socket !== connection || connection.readyState !== 1) return;
                    setState(previous => ({ ...previous,
                        branches: mergeWaypointSnapshot(previous.branches, branch, snapshot) }));
                })).finally(() => clearTimeout(timeout));
            };
            socket.onmessage = event => {
                if (disposed) return;
                let message;
                try { message = JSON.parse(event.data); } catch { return; }
                if (typeof message.self === 'string') self = message.self.startsWith('vessels.') ? message.self : `vessels.${message.self}`;
                if (!Array.isArray(message.updates)) return;
                const receivedAt = Date.now();
                setState(previous => {
                    const branches = mergeWaypointDelta(previous.branches, message, self, receivedAt);
                    return branches === previous.branches ? previous : { ...previous, branches };
                });
            };
            socket.onerror = () => { if (!disposed) socket.close(); };
            socket.onclose = () => {
                if (disposed) return;
                snapshotController?.abort();
                setState({ connected: false, branches: {} });
                clearTimeout(retry);
                retry = setTimeout(connect, SIGNALK_RECONNECT_DELAY_MS);
            };
        };
        connect();
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            disposed = true;
            snapshotController?.abort();
            clearTimeout(retry);
            clearInterval(timer);
            socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
            socket.close();
        };
    }, [address, enabled]);
    return deriveWaypoint(state.branches, state.connected, position, now);
}
