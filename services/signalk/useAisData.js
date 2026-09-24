import { useEffect, useState } from 'react';
import { getSignalKSocketUrl } from './serverAddress';

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
        const connect = () => {
            const url = new URL(getSignalKSocketUrl(address));
            url.searchParams.set('subscribe', 'none');
            socket = new WebSocket(url.toString());
            socket.onopen = () => {
                if (disposed) return;
                setState({ status: 'connected', targets: {} });
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
                if (Object.keys(changes).length) setState(previous => ({ ...previous, targets: {
                    ...previous.targets, [id]: { ...previous.targets[id], ...changes, receivedAt: Date.now() },
                } }));
            };
            socket.onerror = () => { if (!disposed) { setState({ status: 'error', targets: {} }); socket.close(); } };
            socket.onclose = () => {
                if (disposed) return;
                setState({ status: 'error', targets: {} });
                retry = setTimeout(connect, 5000);
            };
        };
        connect();
        const prune = setInterval(() => setState(previous => ({ ...previous,
            targets: Object.fromEntries(Object.entries(previous.targets).filter(([, target]) => Date.now() - target.receivedAt < 300000)),
        })), 10000);
        return () => {
            disposed = true;
            clearTimeout(retry);
            clearInterval(prune);
            socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
            socket.close();
        };
    }, [address, enabled]);
    return enabled ? state : { status: 'off', targets: {} };
}
