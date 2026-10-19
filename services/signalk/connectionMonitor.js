export const CONNECTION_CHECK_INTERVAL_MS = 5000;
export const CONNECTION_PROBE_TIMEOUT_MS = 3000;
export const CONNECTION_OPEN_TIMEOUT_MS = 8000;

function requestId() {
    return globalThis.crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, digit => {
        const random = Math.floor(Math.random() * 16);
        return (digit === 'x' ? random : (random & 3) | 8).toString(16);
    });
}

// Query an unknown request UUID over the data socket: the read-only 404 response
// confirms that this same Signal K connection is working in both directions.
export function monitorSignalKConnection(socket, onLost, {
    onConfirmed = () => {}, eventTarget = globalThis.window,
} = {}) {
    let disposed = false;
    let opened = false;
    let confirmed = false;
    const started = Date.now();
    let lastProbe = -Infinity;
    let probe;
    const cancelProbe = () => {
        if (!probe) return;
        clearTimeout(probe.timeout);
        probe = undefined;
    };
    const dispose = () => {
        disposed = true;
        clearInterval(timer);
        cancelProbe();
        eventTarget?.removeEventListener('offline', check);
    };
    const lose = () => {
        if (disposed) return;
        dispose();
        onLost();
    };
    const confirm = () => {
        if (!confirmed) { confirmed = true; onConfirmed(); }
    };
    function check() {
        if (disposed || !opened || probe) return;
        if (socket.readyState !== 1) { lose(); return; }
        lastProbe = Date.now();
        const current = { requestId: requestId() };
        probe = current;
        current.timeout = setTimeout(() => {
            if (probe === current) lose();
        }, CONNECTION_PROBE_TIMEOUT_MS);
        try {
            socket.send(JSON.stringify({ requestId: current.requestId, query: true }));
        } catch { lose(); }
    }
    const timer = setInterval(() => {
        if (!opened) {
            if (Date.now() - started >= CONNECTION_OPEN_TIMEOUT_MS) lose();
        } else if (Date.now() - lastProbe >= CONNECTION_CHECK_INTERVAL_MS) check();
    }, 1000);
    eventTarget?.addEventListener('offline', check);
    return {
        opened() { if (!disposed && !opened) { opened = true; check(); } },
        message(message) {
            if (disposed || !message || typeof message !== 'object' || Array.isArray(message)) return;
            if (message.statusCode === 401 || message.statusCode === 403) { lose(); return; }
            if (probe && message.requestId === probe.requestId && Number.isInteger(message.statusCode)) {
                if (message.statusCode >= 500) { lose(); return; }
                if (message.statusCode >= 200 && message.statusCode < 500) {
                    cancelProbe();
                    confirm();
                }
            } else if (typeof message.self === 'string' || Array.isArray(message.updates)) {
                // Receiving telemetry cannot cancel an unanswered round-trip query.
                confirm();
            }
        },
        dispose,
    };
}
