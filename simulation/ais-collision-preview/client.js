(function () {
    const scenario = window.AISCollisionSimulation;
    const state = { level: 'none', second: false, startedAt: performance.now() };
    const sockets = new Set();
    const previousSettings = localStorage.getItem('@ajustes_consola');
    const previousAnchor = localStorage.getItem('@anchor_watch_v1');
    localStorage.setItem('@ajustes_consola', JSON.stringify({ language: 'es',
        signalKAddress: 'http://ais-simulation.invalid:3000', aisCollisionEnabled: true,
        aisWarningCpaNm: 0.5, aisWarningTcpaMinutes: 15, aisDangerCpaNm: 0.2, aisDangerTcpaMinutes: 5,
        aisRangeNm: 6, depthAlarmEnabled: false }));
    localStorage.removeItem('@anchor_watch_v1');
    window.addEventListener('pagehide', () => {
        for (const [key, value] of [['@ajustes_consola', previousSettings], ['@anchor_watch_v1', previousAnchor]]) {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        }
    });
    function publish(socket) {
        if (socket.readyState !== 1) return;
        for (const message of scenario.messages({ ...state, elapsedSeconds: (performance.now() - state.startedAt) / 1000 })) {
            if (socket.context !== 'vessels.*' && message.context !== scenario.SELF) continue;
            const updates = message.updates.map(update => ({ ...update,
                values: update.values.filter(value => socket.paths.has(value.path)) })).filter(update => update.values.length);
            if (updates.length) socket.message({ ...message, updates });
        }
    }
    const NativeWebSocket = window.WebSocket;
    class DemoSocket extends EventTarget {
        constructor(url, protocols) {
            super();
            if (new URL(url).hostname !== 'ais-simulation.invalid') return new NativeWebSocket(url, protocols);
            this.readyState = 0;
            this.paths = new Set();
            this.context = 'vessels.self';
            sockets.add(this);
            setTimeout(() => {
                if (this.readyState !== 0) return;
                this.readyState = 1;
                this.onopen?.(new Event('open'));
                this.message({ self: scenario.SELF, version: '1.7.0' });
                publish(this);
            }, 80);
        }
        message(data) {
            const event = new MessageEvent('message', { data: JSON.stringify(data) });
            this.onmessage?.(event);
            this.dispatchEvent(event);
        }
        send(raw) {
            const message = JSON.parse(raw);
            if (message.query && message.requestId) {
                setTimeout(() => this.readyState === 1 && this.message({ requestId: message.requestId, statusCode: 404 }), 0);
            }
            if (Array.isArray(message.subscribe)) {
                this.context = message.context;
                for (const entry of message.subscribe) this.paths.add(entry.path);
            }
        }
        close() { this.readyState = 3; sockets.delete(this); this.onclose?.(new Event('close')); }
    }
    Object.assign(DemoSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
    window.WebSocket = DemoSocket;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, options) => {
        const url = new URL(typeof input === 'string' ? input : input.url, location.href);
        if (url.hostname === 'ais-simulation.invalid') {
            const id = `vessels.${decodeURIComponent(url.pathname.split('/api/vessels/')[1] || '')}`;
            return Promise.resolve(new Response(JSON.stringify(scenario.METADATA[id] || {}), { headers: { 'Content-Type': 'application/json' } }));
        }
        if (url.hostname === 'api.github.com' && url.pathname.includes('/releases')) {
            return Promise.resolve(new Response('[]', { headers: { 'Content-Type': 'application/json' } }));
        }
        return nativeFetch(input, options);
    };
    setInterval(() => { for (const socket of sockets) publish(socket); }, 500);

    function controls() {
        const host = document.createElement('div');
        host.id = 'temporary-ais-simulation';
        host.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647;max-width:calc(100vw - 24px)';
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `<style>
            *{box-sizing:border-box}section{width:320px;max-width:calc(100vw - 24px);padding:14px;border:2px solid #66d5ef;border-radius:14px;background:#10202cf5;color:#eaf5fb;font:14px system-ui;box-shadow:0 5px 30px #0009}
            header{display:flex;align-items:center;justify-content:space-between;gap:8px}strong{font-size:12px;letter-spacing:.6px;color:#66d5ef}p{margin:10px 0;font-size:12px;line-height:1.45}nav{display:grid;grid-template-columns:1fr 1fr;gap:7px}
            button{font:inherit;min-height:42px;border:1px solid #52778b;border-radius:8px;background:#1b394c;color:white;cursor:pointer}button:hover{background:#2b536b}.orange{color:#ffc16b}.red{color:#ff8989}.small{min-height:30px;padding:4px 8px;font-size:12px}footer{margin-top:10px;text-align:right}a{color:#b6d6e5;font-size:12px}.folded main{display:none}
        </style><section><header><strong>SIMULACIÓN AIS TEMPORAL</strong><button class="small" id="fold">Ocultar</button></header><main>
            <p id="status"></p><nav>
            <button class="orange" id="orange">Naranja · barco A</button><button class="red" id="red">Rojo · barco A</button>
            <button id="second">Añadir barco B</button><button id="clear">Quitar alarmas</button></nav>
            <p>1. Activa DATOS AIS y pulsa Naranja.<br>2. Cierra el aviso y silencia con la campana.<br>3. Pulsa Rojo o añade el barco B: vuelve a avisar.</p>
            <p>Rojo → naranja mantiene el mute. La bajada tarda unos 8 s en confirmarse. Oculta este panel para ver los instrumentos.</p>
            <footer><a href="/__ais-simulation/stop">Terminar simulación</a></footer></main></section>`;
        document.body.appendChild(host);
        const update = () => {
            shadow.getElementById('status').textContent = `A: ${state.level === 'danger' ? 'rojo' : state.level === 'warning' ? 'naranja' : 'sin alarma'} · B: ${state.second ? 'en alarma' : 'fuera'}`;
            shadow.getElementById('second').textContent = state.second ? 'Quitar barco B' : 'Añadir barco B';
            for (const socket of sockets) publish(socket);
        };
        const setLevel = level => { state.level = level; state.startedAt = performance.now(); update(); };
        shadow.getElementById('orange').onclick = () => setLevel('warning');
        shadow.getElementById('red').onclick = () => setLevel('danger');
        shadow.getElementById('second').onclick = () => { state.second = !state.second; update(); };
        shadow.getElementById('clear').onclick = () => { state.second = false; setLevel('none'); };
        shadow.getElementById('fold').onclick = event => {
            const folded = shadow.querySelector('section').classList.toggle('folded');
            event.target.textContent = folded ? 'Mostrar' : 'Ocultar';
        };
        update();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', controls, { once: true });
    else controls();
})();
