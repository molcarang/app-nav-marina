// Se conservan las claves originales para recuperar los ajustes ya guardados.
import { DEFAULT_SIGNALK_ADDRESS } from '../../../services/signalk/serverAddress.js';
import { DEFAULT_HISTORY_HOURS } from './twsHistory.js';
import { DEFAULT_HEEL_ALARM_DEGREES } from './heelAlarm.js';
import { DEFAULT_LOW_FUEL_PERCENT } from './lowFuelAlarm.js';
import { DEFAULT_TACHOMETER_MAX_RPM, DEFAULT_TACHOMETER_RED_ZONE_RPM } from './engineRpmSettings.js';
export const SETTINGS_STORAGE_KEY = '@ajustes_consola';
export const DEFAULT_SETTINGS = {
    language: 'es',
    aisRangeNm: 6,
    historyHours: DEFAULT_HISTORY_HOURS,
    sogHistoryHours: DEFAULT_HISTORY_HOURS,
    signalKAddress: DEFAULT_SIGNALK_ADDRESS,
    minAnguloCeñida: 20,
    maxAnguloCeñida: 60,
    rudderLimit: 35,
    heelAlarmDegrees: DEFAULT_HEEL_ALARM_DEGREES,
    lowFuelAlarmPercent: DEFAULT_LOW_FUEL_PERCENT,
    tachometerMaxRpm: DEFAULT_TACHOMETER_MAX_RPM,
    tachometerRedZoneRpm: DEFAULT_TACHOMETER_RED_ZONE_RPM,
    depthAlarmMeters: 3,
    depthAlarmEnabled: true,
    depthAlarmSound: true,
    nightIntensity: 30,
};
