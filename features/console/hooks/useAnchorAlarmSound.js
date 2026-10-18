import { useAlarmSound } from './useAlarmSound';

export function useAnchorAlarmSound(active) {
    return useAlarmSound(active, require('../../../assets/sounds/anchor-alarm.wav'));
}
