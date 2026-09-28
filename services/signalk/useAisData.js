import { useEffect, useState } from 'react';
import { createPendingUpdates } from './pendingUpdates';
import { getSignalKSocketUrl, SIGNALK_RECONNECT_DELAY_MS } from './serverAddress';

const paths = ['navigation.position', 'navigation.courseOverGroundTrue', 'navigation.speedOverGround', 'navigation.headingTrue', 'name', 'mmsi'];
export function useAisData(address, enabled) {
    const [state, setState] = useState({ status: 'off', targets: {} });
    useEffect(() => {
        setState({ status: enabled ? 'connecting' : 'off', targets: {} });
        if (!enabled) return;
        let disposed = false;
        let socket;
        let retry;
        let self;
        let pending;
        const pendingTargets = new Map();
        const connect = () => {
            pending?.dispose();
            pendingTargets.clear();
            pending = createPendingUpdates(batch => {
                if (disposed) return;
                const targets = Object.fromEntries(pendingTargets);
                pendingTargets.clear();
                setState(previous => ({
                    status: batch.status ?? previous.status,
                    targets: batch.reset ? targets : { ...previous.targets,
                        ...Object.fromEntries(Object.entries(targets).map(([id, changes]) =>
                            [id, { ...previous.targets[id], ...changes }])) },
                }));
            });
            const url = new URL(getSignalKSocketUrl(address));
            url.searchParams.set('subscribe', 'none');
            socket = new WebSocket(url.toString());
            socket.onopen = () => {
                if (disposed) return;
                pending.add({ status: 'connected', reset: true });
                socket.send(JSON.stringify({ context: 'vessels.*', subscribe: paths.map(path => ({ path, period: 1000, format: 'delta' })) }));
            };
            socket.onmessage = event => {
                if (disposed) return;
                let message;
                try { message = JSON.parse(event.data); } catch { return; }
                if (typeof message.self === 'string') self = message.self.startsWith('vessels.') ? message.self : `vessels.${message.self}`;
                const id = message.context;
                if (!self || typeof id !== 'string' || !id.startsWith('vessels.') || id === self || id === 'vessels.self' || !Array.isArray(message.updates)) return;
                const changes = {};
                for (const update of message.updates) {
                    for (const item of update.values ?? []) {
                        if (item.path === '' && item.value && typeof item.value === 'object') {
                            for (const field of ['name', 'mmsi']) {
                                if (typeof item.value[field] === 'string') changes[field] = item.value[field];
                            }
                        }
                        if (paths.includes(item.path)) changes[item.path] = item.value;
                        if (item.path === 'navigation.position') changes.positionReceivedAt = Date.now();
                    }
                }
                if (Object.keys(changes).length) {
                    pendingTargets.set(id, { ...pendingTargets.get(id), ...changes, receivedAt: Date.now() });
                    pending.add({});
                }
            };
            socket.onerror = () => { if (!disposed) socket.close(); };
            socket.onclose = () => {
                if (disposed) return;
                pending.dispose();
                pendingTargets.clear();
                setState({ status: 'error', targets: {} });
                clearTimeout(retry);
                retry = setTimeout(connect, SIGNALK_RECONNECT_DELAY_MS);
            };
        };
        connect();
        const prune = setInterval(() => setState(previous => ({ ...previous,
            targets: Object.fromEntries(Object.entries(previous.targets).filter(([, target]) => Date.now() - target.receivedAt < 300000)),
        })), 10000);
        return () => {
            disposed = true;
            pending.dispose();
            pendingTargets.clear();
            clearTimeout(retry);
            clearInterval(prune);
            socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
            socket.close();
        };
    }, [address, enabled]);
    return enabled ? state : { status: 'off', targets: {} };
}
