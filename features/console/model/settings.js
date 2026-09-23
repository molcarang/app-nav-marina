// Se conservan las claves originales para recuperar los ajustes ya guardados.
import { DEFAULT_SIGNALK_ADDRESS } from '../../../services/signalk/serverAddress.js';
export const SETTINGS_STORAGE_KEY = '@ajustes_consola';
export const DEFAULT_SETTINGS = {
    signalKAddress: DEFAULT_SIGNALK_ADDRESS,
    minAnguloCeñida: 20,
    maxAnguloCeñida: 60,
    rudderLimit: 35,
};
