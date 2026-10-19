import { useTranslation } from '../../../localization/LanguageProvider';
import { useContext } from 'react';
import { NightModeContext } from '../../../components/NightDimmer';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/consoleStyles';
import AisToggleButton from './AisToggleButton';
import { useControlScale } from '../../../hooks/useControlScale';
import FullscreenButton from '../../../components/FullscreenButton';
import AnchorButton from './AnchorButton';
import SoftwareVersion from './SoftwareVersion';
import AppExitButton from './AppExitButton';
import EngineStatusIndicator from './EngineStatusIndicator';
const HEADER_INDICATOR_HEIGHT = 36;
export default function ConnectionHeader({ navigation, settings, isConnected, isNightMode, onOpenSettings, style, aisVisibleCount, aisTargets, aisStatus, aisAuto, onToggleAisAuto, aisRangeNm, onAisRangeChange, aisVisible, onToggleAis, settingsWidth, settingsInline = false, onFullscreenBounds }) {
    const { t } = useTranslation();
    const { enabled: nightEnabled, toggle: toggleNightMode } = useContext(NightModeContext);
    const scale = useControlScale();
    const surface = { height: 36 * scale, paddingHorizontal: 12 * scale };
    const textSize = { fontSize: 12 * scale };
    const accent = isConnected ? '#45d39a' : '#ef6b72';
    return (
        <View style={[styles.headerRow, badgeStyles.header, onToggleAis && { flexWrap: 'wrap' }, style]}>
            <View style={[badgeStyles.connectionGroup, !settingsInline && { flex: 1 }, onToggleAis && { marginBottom: 42 * scale }]}>
            <View style={{ width: 36 * scale, height: 36 * scale, alignSelf: 'center', zIndex: 3 }}>
            <View accessible accessibilityLiveRegion="polite"
                accessibilityLabel={t(isConnected ? 'connected' : 'disconnected')}
                style={[badgeStyles.surface, surface, badgeStyles.badge, {
                    width: 36 * scale, paddingHorizontal: 0, justifyContent: 'center',
                    borderColor: isConnected ? '#29634f' : '#71383f' }]}>
                <View pointerEvents="none" style={badgeStyles.highlight} />
                <MaterialIcons accessible={false} name={isConnected ? 'link' : 'link-off'} size={24 * scale} color={accent} />
            </View>
            <View style={{ position: 'absolute', left: 0, top: 42 * scale + 5, flexDirection: 'row', gap: 8 * scale }}>
                <EngineStatusIndicator connected={isConnected} engineRunning={navigation?.engineRunning} navigation={navigation} settings={settings} />
            </View>
            </View>
            {toggleNightMode && <TouchableOpacity onPress={toggleNightMode}
                accessibilityRole="button" accessibilityLabel={t(nightEnabled ? 'switchDay' : 'switchNight')}
                style={[badgeStyles.surface, surface, badgeStyles.modeButton]}>
                <View pointerEvents="none" style={badgeStyles.highlight} />
                <MaterialIcons name={nightEnabled ? 'light-mode' : 'dark-mode'} size={20 * scale} color="#aaa" />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[badgeStyles.settingsText, textSize]}>
                    {t(nightEnabled ? 'dayButton' : 'nightButton')}
                </Text>
            </TouchableOpacity>}
            {onOpenSettings && (<TouchableOpacity
                onPress={onOpenSettings}
                accessibilityRole="button"
                accessibilityLabel={t('openSettings')}
                style={[badgeStyles.surface, surface, badgeStyles.settingsButton, settingsInline && { marginLeft: 0, flexShrink: 1 }, settingsWidth != null && { width: settingsWidth }]}>
                <View pointerEvents="none" style={badgeStyles.highlight} />
                <MaterialIcons
                    name="settings"
                    size={22 * scale}
                    color="#aaa"
                />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[badgeStyles.settingsText, textSize]}>{t('settingsButton')}</Text>
            </TouchableOpacity>)}
            <AppExitButton />
            <FullscreenButton onBounds={onFullscreenBounds} />
            {onToggleAis && <SoftwareVersion style={{ flexShrink: 1, transform: [{ translateY: 5 }] }} />}
            </View>
            {/* In portrait, use the gap above the compass for the taller motor indicator. */}
            {onToggleAis && <View style={{ width: '100%', gap: 8 * scale, alignItems: 'flex-start', transform: [{ translateY: 12.6 * scale }] }}>
                <AnchorButton position={navigation?.position} receivedAt={navigation?.positionReceivedAt} connected={isConnected} />
                <AisToggleButton targets={aisTargets} position={navigation?.position} positionReceivedAt={navigation?.positionReceivedAt} connected={isConnected && aisStatus === 'connected'} visibleCount={aisVisibleCount} auto={aisAuto} onToggleAuto={onToggleAisAuto} rangeNm={aisRangeNm} onRangeChange={onAisRangeChange} visible={aisVisible} onPress={onToggleAis} />
            </View>}
        </View>
    );
}

const badgeStyles = StyleSheet.create({
    connectionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    modeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderColor: '#aaa', flexShrink: 1 },
    surface: { height: HEADER_INDICATOR_HEIGHT, alignSelf: 'center', transform: [{ translateY: 5 }],
        paddingHorizontal: 12, paddingVertical: 0, borderRadius: 12, borderWidth: 1,
        backgroundColor: '#10202c', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
    settingsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderColor: '#aaa', marginLeft: 'auto' },
    settingsText: { fontFamily: 'NauticalFont', fontWeight: 'normal', fontSize: 12, color: '#aaa', flexShrink: 1 },
    header: { alignItems: 'center', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
    highlight: { position: 'absolute', top: 1, left: 12, right: 12, height: 1,
        backgroundColor: 'rgba(225,245,255,0.16)' },
});
