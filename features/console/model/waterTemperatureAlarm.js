import { WATER_TEMPERATURE_ALARM_PATH_PATTERN } from '../../../services/signalk/paths.js';
import { deriveNotificationAlarm } from './notificationAlarm.js';

/** Mirror received engine temperature alarms, without inventing a temperature limit. */
export function deriveWaterTemperatureAlarm(data) {
    return deriveNotificationAlarm(data, WATER_TEMPERATURE_ALARM_PATH_PATTERN);
}
