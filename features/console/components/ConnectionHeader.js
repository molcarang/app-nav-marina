import { useTranslation } from '../../../localization/LanguageProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/consoleStyles';
import AisToggleButton from './AisToggleButton';
const HEADER_INDICATOR_HEIGHT = 36;
export default function ConnectionHeader({ isConnected, isNightMode, onOpenSettings, style, aisVisible, onToggleAis, settingsWidth }) {
    const { t } = useTranslation();
    const accent = isConnected ? '#45d39a' : '#ef6b72';
    return (
        <View style={[styles.headerRow, badgeStyles.header, style]}>
            <View accessible accessibilityLiveRegion="polite"
                accessibilityLabel={t(isConnected ? 'connected' : 'disconnected')}
                style={[badgeStyles.surface, badgeStyles.badge, { borderColor: isConnected ? '#29634f' : '#71383f' }]}>
                <View pointerEvents="none" style={badgeStyles.highlight} />
                <View style={[badgeStyles.lightHalo, { backgroundColor: isConnected ? '#193e34' : '#44252d' }]}>
                    <View style={[badgeStyles.light, { backgroundColor: accent, shadowColor: accent }]} />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
                    style={[styles.statusText, badgeStyles.text, { color: accent }]}>
                    {t(isConnected ? 'connected' : 'disconnected')}
                </Text>
            </View>
            {onToggleAis && <AisToggleButton visible={aisVisible} onPress={onToggleAis} />}
            {onOpenSettings && (<TouchableOpacity
                onPress={onOpenSettings}
                accessibilityRole="button"
                accessibilityLabel={t('openSettings')}
                style={[badgeStyles.surface, badgeStyles.settingsButton, settingsWidth != null && { width: settingsWidth }]}>
                <View pointerEvents="none" style={badgeStyles.highlight} />
                <MaterialIcons
                    name="settings"
                    size={22}
                    color="#aaa"
                />
                <Text numberOfLines={1} adjustsFontSizeToFit style={badgeStyles.settingsText}>{t('settingsButton')}</Text>
            </TouchableOpacity>)}
        </View>
    );
}

const badgeStyles = StyleSheet.create({
    surface: { height: HEADER_INDICATOR_HEIGHT, alignSelf: 'center', transform: [{ translateY: 5 }],
        paddingHorizontal: 12, paddingVertical: 0, borderRadius: 12, borderWidth: 1,
        backgroundColor: '#10202c', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
    settingsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderColor: '#aaa', marginLeft: 'auto' },
    settingsText: { fontFamily: 'NauticalFont', fontWeight: 'normal', fontSize: 12, color: '#aaa', flexShrink: 1 },
    header: { alignItems: 'center', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 9 },
    highlight: { position: 'absolute', top: 1, left: 12, right: 12, height: 1,
        backgroundColor: 'rgba(225,245,255,0.16)' },
    lightHalo: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    light: { width: 8, height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, shadowRadius: 4 },
    text: { fontFamily: 'NauticalFont', fontWeight: 'normal', fontSize: 11, letterSpacing: 0.5, flexShrink: 1 },
});
