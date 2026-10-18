// La configuración de transporte se mantiene separada del catálogo de datos.
import { DEFAULT_SIGNALK_ADDRESS, getSignalKSocketUrl } from './serverAddress.js';
export const SIGNALK_IP = new URL(DEFAULT_SIGNALK_ADDRESS).hostname;
export const SOCKET_URL = getSignalKSocketUrl(DEFAULT_SIGNALK_ADDRESS);
export { INITIAL_DATA } from './paths.js';
