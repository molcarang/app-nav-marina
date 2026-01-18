export const SIGNALK_IP = 'openplotter.local'; // Cambia por tu IP si es necesario
export const SOCKET_URL = `ws://${SIGNALK_IP}:3000/signalk/v1/stream`;
// Rutas de datos relevantes para la consola
export const INITIAL_DATA = {
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
    'environment.wind.angleApparent': 0,
    'steering.autopilot.state': 'standby',
    'vessels.self.navigation.attitude.roll': 0
};
