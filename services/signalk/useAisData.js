import { useEffect, useState } from 'react';
import { dataTimestamp, MOTION_TIME_KEYS } from './dataTimestamp.js';
import { createPendingUpdates } from './pendingUpdates';
import { getSignalKSocketUrl, SIGNALK_RECONNECT_DELAY_MS } from './serverAddress';
import { AIS_NAVIGATION_PATHS, AIS_SUBSCRIPTION_PATHS, createAisIdentityLoader, readAisIdentity } from './aisIdentity.js';

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
        let identityLoader;
        const identities = new Map();
        const pendingTargets = new Map();
        const connect = () => {
            pending?.dispose();
            identityLoader?.dispose();
            identities.clear();
            self = undefined;
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
            const connection = socket;
            identityLoader = createAisIdentityLoader({ socketUrl: url.toString(), onIdentity: (id, identity) => {
                if (disposed || socket !== connection || connection.readyState !== 1) return;
                // Live metadata always wins over a slower REST response.
                const merged = { ...identity, ...identities.get(id) };
                identities.set(id, merged);
                if (!Object.keys(merged).length) return;
                pendingTargets.set(id, { ...merged, ...pendingTargets.get(id) });
                pending.add({});
            } });
            socket.onopen = () => {
                if (disposed) return;
                pending.add({ status: 'connected', reset: true });
                socket.send(JSON.stringify({ context: 'vessels.*', subscribe: AIS_SUBSCRIPTION_PATHS.map(path => ({ path, period: 1000, format: 'delta' })) }));
            };
            socket.onmessage = event => {
                if (disposed) return;
                let message;
                try { message = JSON.parse(event.data); } catch { return; }
                if (!message || typeof message !== 'object') return;
                if (typeof message.self === 'string') self = message.self.startsWith('vessels.') ? message.self : `vessels.${message.self}`;
                const id = message.context;
                if (!self || typeof id !== 'string' || !id.startsWith('vessels.') || id === self || id === 'vessels.self' || !Array.isArray(message.updates)) return;
                const changes = {};
                for (const update of message.updates) {
                    for (const item of update.values ?? []) {
                        if (item.path === '') Object.assign(changes, readAisIdentity(item.value));
                        if (item.path === 'name' || item.path === 'mmsi') Object.assign(changes, readAisIdentity({ [item.path]: item.value }));
                        if (AIS_NAVIGATION_PATHS.includes(item.path)) changes[item.path] = item.value;
                        if (MOTION_TIME_KEYS[item.path]) changes[MOTION_TIME_KEYS[item.path]] = dataTimestamp(update, Date.now());
                        if (item.path === 'navigation.position') changes.positionReceivedAt = Date.now();
                    }
                }
                if (Object.keys(changes).length) {
                    identities.set(id, { ...identities.get(id), ...readAisIdentity(changes) });
                    pendingTargets.set(id, { ...identities.get(id), ...pendingTargets.get(id), ...changes, receivedAt: Date.now() });
                    pending.add({});
                    if (!identities.get(id)?.name) identityLoader.request(id);
                }
            };
            socket.onerror = () => { if (!disposed) socket.close(); };
            socket.onclose = () => {
                if (disposed) return;
                pending.dispose();
                identityLoader.dispose();
                identities.clear();
                pendingTargets.clear();
                setState({ status: 'error', targets: {} });
                clearTimeout(retry);
                retry = setTimeout(connect, SIGNALK_RECONNECT_DELAY_MS);
            };
        };
        connect();
        const prune = setInterval(() => setState(previous => ({ ...previous,
            targets: Object.fromEntries(Object.entries(previous.targets).filter(([id, target]) => {
                if (Date.now() - target.receivedAt < 300000) return true;
                identities.delete(id);
                identityLoader?.forget(id);
                return false;
            })),
        })), 10000);
        return () => {
            disposed = true;
            identityLoader?.dispose();
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
