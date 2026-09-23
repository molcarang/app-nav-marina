import { useEffect, useRef, useState } from 'react';
import { INITIAL_DATA } from './config';
import { SIGNALK_PATHS } from './paths';
import { DEFAULT_SIGNALK_ADDRESS, getSignalKSocketUrl } from './serverAddress';
/**
 * Hook personalizado para gestionar la conexión WebSocket y el estado de los datos de Signal K.
 * @returns {object} Estado actualizado de los datos de Signal K y conexión.
 */
export const useSignalKData = (address = DEFAULT_SIGNALK_ADDRESS, enabled = true, onWindReading, onSogReading) => {
    const sogListener = useRef(onSogReading);
    useEffect(() => { sogListener.current = onSogReading; }, [onSogReading]);
    const windListener = useRef(onWindReading);
    useEffect(() => { windListener.current = onWindReading; }, [onWindReading]);
    // Estado principal con los valores de las rutas suscritas
    const [signalKData, setSignalKData] = useState(INITIAL_DATA);
    // Referencia persistente al WebSocket
    const wsRef = useRef(null);
    useEffect(() => {
        if (!enabled) return;
        setSignalKData(INITIAL_DATA);
        let active = true;
        const socket = new WebSocket(getSignalKSocketUrl(address));
        wsRef.current = socket;
        socket.onopen = () => {
            if (!active) return;
            setSignalKData(prev => ({ ...prev, isConnected: true }));
            // Suscribirse a todas las rutas excepto isConnected
            const pathsToSubscribe = Object.keys(INITIAL_DATA).filter(key => key !== 'isConnected');
            const subscribeMessage = JSON.stringify({
                context: 'vessels.self',
                subscribe: pathsToSubscribe.map(path => ({
                    path,
                    period: 500,
                    format: 'delta',
                })),
            });
            socket.send(subscribeMessage);
        };
        socket.onmessage = (event) => {
            if (!active) return;
            let data;
            try { data = JSON.parse(event.data); } catch { return; }
            if (Array.isArray(data.updates)) {
                const updates = {};
                for (const update of data.updates) {
                    for (const value of update.values ?? []) {
                    if (value.path in INITIAL_DATA) {
                        updates[value.path] = value.value;
                        if (value.path === SIGNALK_PATHS.position) updates.positionReceivedAt = Date.now();
                        if (value.path === SIGNALK_PATHS.simulatedLatitude) updates.simulatedLatitudeReceivedAt = Date.now();
                        if (value.path === SIGNALK_PATHS.simulatedLongitude) updates.simulatedLongitudeReceivedAt = Date.now();
                        if (value.path === 'environment.wind.speedTrue' && Number.isFinite(value.value) && value.value >= 0) {
                            const receivedAt = Date.now();
                            updates.twsReceivedAt = receivedAt;
                            windListener.current?.(value.value * 1.94384, receivedAt);
                        }
                        if (value.path === 'navigation.speedOverGround' && Number.isFinite(value.value) && value.value >= 0) {
                            sogListener.current?.(value.value * 1.94384, Date.now());
                        }
                    }
                    }
                }
                if (Object.keys(updates).length > 0) {
                    setSignalKData(prev => ({ ...prev, ...updates }));
                }
            }
        };
        socket.onerror = () => {
            if (!active) return;
            setSignalKData(prev => ({ ...prev, isConnected: false }));
        };
        socket.onclose = () => {
            if (!active) return;
            setSignalKData(prev => ({ ...prev, isConnected: false }));
        };
        // Limpieza al desmontar
        return () => {
            active = false;
            socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
            socket.close();
            if (wsRef.current === socket) wsRef.current = null;
        };
    }, [address, enabled]);
    return signalKData;
};
