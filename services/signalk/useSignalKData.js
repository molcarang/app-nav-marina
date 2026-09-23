import { useEffect, useRef, useState } from 'react';
import { INITIAL_DATA } from './config';
import { DEFAULT_SIGNALK_ADDRESS, getSignalKSocketUrl } from './serverAddress';
/**
 * Hook personalizado para gestionar la conexión WebSocket y el estado de los datos de Signal K.
 * @returns {object} Estado actualizado de los datos de Signal K y conexión.
 */
export const useSignalKData = (address = DEFAULT_SIGNALK_ADDRESS, enabled = true) => {
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
            const data = JSON.parse(event.data);
            if (data.updates && data.updates.length > 0) {
                const values = data.updates[0].values;
                const updates = {};
                values.forEach(value => {
                    if (value.path in INITIAL_DATA) {
                        updates[value.path] = value.value;
                    }
                });
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
