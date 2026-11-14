import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { useControlScale } from '../../../hooks/useControlScale';
import { AIS_RISK_COLORS } from '../model/aisCollisionRisk';

export default function AisAlarmBell({ alarm }) {
    const { t } = useTranslation();
    const scale = useControlScale();
    if (!alarm?.level && !alarm?.muted) return null;
    const color = AIS_RISK_COLORS[alarm.level] ?? '#a5afb7';
    const side = Math.max(44, 44 * scale);
    return <TouchableOpacity accessibilityRole="button"
        accessibilityLabel={t(alarm.muted ? 'aisAlarmUnmute' : 'aisAlarmMute')}
        accessibilityState={{ selected: alarm.muted }}
        accessibilityHint={t('aisAlarmMuteHint')}
        onPress={alarm.toggleMute}
        style={{ width: side, height: side, minWidth: side, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, borderWidth: 1, borderColor: color, backgroundColor: '#10202c' }}>
        <MaterialIcons accessible={false} name={alarm.muted ? 'notifications-off' : 'notifications-active'}
            size={24 * scale} color={alarm.muted ? '#a5afb7' : color} />
    </TouchableOpacity>;
}
