import { useEffect, useRef, useState } from 'react';
import { INITIAL_DATA, SOCKET_URL } from './config';
/**
 * Hook personalizado para gestionar la conexión WebSocket y el estado de los datos de Signal K.
 * @returns {object} Estado actualizado de los datos de Signal K y conexión.
 */
export const useSignalKData = () => {
    // Estado principal con los valores de las rutas suscritas
    const [signalKData, setSignalKData] = useState(INITIAL_DATA);
    // Referencia persistente al WebSocket
    const wsRef = useRef(null);
    useEffect(() => {
        wsRef.current = new WebSocket(SOCKET_URL);
        wsRef.current.onopen = () => {
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
            wsRef.current.send(subscribeMessage);
        };
        wsRef.current.onmessage = (event) => {
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
        wsRef.current.onerror = () => {
            setSignalKData(prev => ({ ...prev, isConnected: false }));
        };
        wsRef.current.onclose = () => {
            setSignalKData(prev => ({ ...prev, isConnected: false }));
        };
        // Limpieza al desmontar
        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, []);
    return signalKData;
};
