/** Agrupa deltas para la pantalla; conserva el último valor de cada path. */
export function createPendingUpdates(publish, delay = 100) {
    let pending = {};
    let timer = null;
    let disposed = false;
    return {
        add(values) {
            if (disposed) return;
            Object.assign(pending, values);
            if (timer !== null) return;
            timer = setTimeout(() => {
                timer = null;
                const batch = pending;
                pending = {};
                if (!disposed) publish(batch);
            }, delay);
        },
        dispose() {
            disposed = true;
            clearTimeout(timer);
            timer = null;
            pending = {};
        },
    };
}
