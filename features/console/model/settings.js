// Se conservan las claves originales para recuperar los ajustes ya guardados.
import { DEFAULT_SIGNALK_ADDRESS } from '../../../services/signalk/serverAddress.js';
import { DEFAULT_HISTORY_HOURS } from './twsHistory.js';
export const SETTINGS_STORAGE_KEY = '@ajustes_consola';
export const DEFAULT_SETTINGS = {
    historyHours: DEFAULT_HISTORY_HOURS,
    sogHistoryHours: DEFAULT_HISTORY_HOURS,
    signalKAddress: DEFAULT_SIGNALK_ADDRESS,
    minAnguloCeñida: 20,
    maxAnguloCeñida: 60,
    rudderLimit: 35,
    depthAlarmMeters: 3,
    depthAlarmSound: true,
};
