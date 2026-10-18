import { useAlarmSound } from './useAlarmSound';

export function useDepthAlarmSound(active) {
    return useAlarmSound(active, require('../../../assets/sounds/depth-alarm.wav'));
}
