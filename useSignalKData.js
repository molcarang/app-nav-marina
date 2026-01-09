import { useEffect, useRef, useState } from 'react';

// --- Configuración de Signal K ---
const SIGNALK_IP = 'openplotter.local'; // ¡REEMPLAZA con tu IP!
const SOCKET_URL = `ws://${SIGNALK_IP}:3000/signalk/v1/stream`;

// Definición de las Rutas de Datos que queremos monitorear
const INITIAL_DATA = {
    isConnected: false,
    'environment.wind.directionTrue': 0, // AWS (m/s)
    'environment.wind.speedApparent': 0, // AWS (m/s)
    'navigation.speedOverGround': 0,      // SOG (m/s)
    'navigation.headingTrue': 0,
    'navigation.depthBelowTransducer': 0,
    'navigation.speedThroughWater': 0,   
    'environment.wind.speedTrue': 0, 
    'navigation.current.drift': 0, 
    'navigation.current.setTrue': 0,
    'propulsion.0.rpm': 0,
    'steering.rudderAngle': 0,
    'propulsion.0.revolutions': 0,
    'environment.wind.angleApparent': 0
};

/**
 * Custom Hook para gestionar la conexión WebSocket y el estado de los datos de Signal K.
 * @returns {object} Un objeto con los datos de Signal K actualizados y el estado de la conexión.
 */
export const useSignalKData = () => {
    // Estado principal que almacena todos los valores de las rutas suscritas
    const [signalKData, setSignalKData] = useState(INITIAL_DATA);

    // Usamos useRef para mantener una referencia al WebSocket que persiste entre renders
    const wsRef = useRef(null);

    useEffect(() => {
        console.log('Intentando conectar a Signal K...');
        wsRef.current = new WebSocket(SOCKET_URL);

        wsRef.current.onopen = () => {
            console.log('Signal K: Conexión establecida.');
            setSignalKData(prev => ({ ...prev, isConnected: true }));

            // 1. Crear y Enviar Solicitud de Suscripción para todas las rutas
            const pathsToSubscribe = Object.keys(INITIAL_DATA).filter(key => key !== 'isConnected');

            const subscribeMessage = JSON.stringify({
                context: 'vessels.self',
                subscribe: pathsToSubscribe.map(path => ({
                    path: path,
                    period: 500, // Actualización cada 500ms
                    format: 'delta',
                })),
            });
            wsRef.current.send(subscribeMessage);
            console.log('Signal K: Suscripción enviada para:', pathsToSubscribe);
        };

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // 2. Procesar Mensajes Delta y actualizar el estado
            if (data.updates && data.updates.length > 0) {
                const values = data.updates[0].values;

                // Creamos un objeto para las actualizaciones con el formato { 'ruta': valor, ... }
                const updates = {};
                values.forEach(value => {
                    if (value.path in signalKData) {
                        updates[value.path] = value.value;
                    }
                });

                // Actualizamos el estado de manera eficiente
                if (Object.keys(updates).length > 0) {
                    setSignalKData(prev => ({ ...prev, ...updates }));
                }
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket Error:', error.message);
            setSignalKData(prev => ({ ...prev, isConnected: false }));
        };

        wsRef.current.onclose = () => {
            console.log('Signal K: Conexión cerrada.');
            setSignalKData(prev => ({ ...prev, isConnected: false }));
        };

        // 3. Función de limpieza al desmontar
        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, []); // El array vacío asegura que la conexión se inicie solo al montar

    return signalKData; // Devolvemos el estado con todos los datos
};