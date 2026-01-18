
import { useEffect, useRef, useState } from 'react';

// --- Configuración de Signal K ---
const SIGNALK_IP = 'openplotter.local'; // Cambia por tu IP si es necesario
const SOCKET_URL = `ws://${SIGNALK_IP}:3000/signalk/v1/stream`;

// Rutas de datos relevantes para la consola
const INITIAL_DATA = {
    isConnected: false,
    'environment.wind.directionTrue': 0,
    'environment.wind.speedTrue': 0,
    'navigation.speedOverGround': 0,
    'navigation.headingTrue': 0,
    'navigation.depthBelowTransducer': 0,
    'navigation.current.drift': 0,
    'navigation.current.setTrue': 0,
    'steering.rudderAngle': 0,
    'propulsion.0.revolutions': 0,
    'environment.wind.angleApparent': 0
};


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
                    if (value.path in signalKData) {
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