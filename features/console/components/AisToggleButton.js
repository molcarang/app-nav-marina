import { useTranslation } from '../../../localization/LanguageProvider';
import { useControlScale } from '../../../hooks/useControlScale';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIS_RANGES_NM, normalizeAisRange } from '../../../components/gauges/shared/aisRange';
import AisRadarBackground from './AisRadarBackground';

export default function AisToggleButton({ visible, onPress, rangeNm = 6, onRangeChange, auto = false, onToggleAuto, fullWidth = false, visibleCount = 0 }) {
    const { t } = useTranslation();
    const scale = useControlScale();
    const color = visible ? '#45d39a' : '#aaa';
    const range = normalizeAisRange(rangeNm);
    const index = AIS_RANGES_NM.indexOf(range);
    return <View style={[
        styles.container,
        { gap: (visible ? 16 : 4) * scale },
        visible && [styles.panel, { padding: 8 * scale, borderRadius: 16 * scale,
            height: 60 * scale + 2, flexWrap: 'nowrap' }],
        visible && fullWidth && { width: '100%' },
    ]}>
        {visible && <AisRadarBackground />}
        <TouchableOpacity onPress={onPress} accessibilityRole="switch"
        accessibilityState={{ checked: visible }} accessibilityLabel={t(visible ? 'hideAis' : 'showAis')}
        style={[styles.button, { borderColor: color, backgroundColor: visible ? '#173e33' : '#10202c', height: 44 * scale, minHeight: 44 * scale, paddingHorizontal: 12 * scale,
            flexShrink: 1, minWidth: 0 }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, { color, fontSize: 12 * scale }]}>{t('aisData')}</Text>
    </TouchableOpacity>
        {visible && onRangeChange && <View style={{ flexDirection: 'row', flex: 1, minWidth: 0, alignItems: 'center', gap: 8 * scale }}>
            <TouchableOpacity onPress={onToggleAuto} accessibilityRole="switch"
                accessibilityState={{ checked: auto }} accessibilityLabel={t('aisAutoZoom')}
                style={[styles.button, { height: 44 * scale, minHeight: 44 * scale, paddingHorizontal: 10 * scale, flexShrink: 1, minWidth: 0,
                    borderColor: auto ? '#45d39a' : '#aaa', backgroundColor: auto ? '#173e33' : '#10202c' }]}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, { color: auto ? '#45d39a' : '#aaa', fontSize: 12 * scale }]}>AUTO</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} adjustsFontSizeToFit accessibilityLiveRegion="polite" style={[styles.text, { color, fontSize: 12 * scale, flex: 1, minWidth: 0, textAlign: 'center' }]}>{t('aisVisibleCount', { count: visibleCount })}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * scale, marginLeft: 'auto', flexShrink: 1, minWidth: 0 }}>
            {[{ label: '−', next: index + 1, title: 'aisZoomOut' },
                { label: '+', next: index - 1, title: 'aisZoomIn' }].map(button => {
                const disabled = !auto && (button.next < 0 || button.next >= AIS_RANGES_NM.length);
                return <View key={button.title} style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
                    {button.title === 'aisZoomIn' && <Text numberOfLines={1} adjustsFontSizeToFit accessibilityLabel={t('aisRange', { range })}
                        style={[styles.text, { color, fontSize: 12 * scale, flexShrink: 1, width: 76 * scale, textAlign: 'center', marginHorizontal: 4 * scale }]}>{range} NM</Text>}
                    <TouchableOpacity accessibilityRole="button"
                    accessibilityLabel={t(button.title)} accessibilityState={{ disabled }} disabled={disabled}
                    onPress={() => onRangeChange(AIS_RANGES_NM[Math.max(0, Math.min(AIS_RANGES_NM.length - 1, button.next))])}
                    style={[styles.button, { minWidth: 44 * scale, minHeight: 44 * scale,
                        alignItems: 'center', borderColor: color, opacity: disabled ? 0.35 : 1 }]}>
                    <Text style={[styles.text, { color, fontSize: 20 * scale }]}>{button.label}</Text>
                </TouchableOpacity></View>;
            })}
            </View>
        </View>}
    </View>;
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
        flexShrink: 1, maxWidth: '100%', alignSelf: 'flex-start' },
    panel: { borderWidth: 1, borderColor: '#426777', backgroundColor: 'rgba(10, 28, 40, 0.94)', overflow: 'hidden' },
    button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10,
        borderWidth: 1, backgroundColor: '#10202c', alignSelf: 'flex-start' },
    text: { fontSize: 12, fontWeight: 'normal', fontFamily: 'NauticalFont' },
});
