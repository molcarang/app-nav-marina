import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { useTranslation } from '../../../localization/LanguageProvider';
import { useControlScale } from '../../../hooks/useControlScale';
import NightDimmer from '../../../components/NightDimmer';
import WaterTemperatureAlarmIndicator from './WaterTemperatureAlarmIndicator';
import OilPressureAlarmIndicator from './OilPressureAlarmIndicator';
import AlternatorChargeAlarmIndicator from './AlternatorChargeAlarmIndicator';
import LowBatteryAlarmIndicator from './LowBatteryAlarmIndicator';
import LowFuelAlarmIndicator from './LowFuelAlarmIndicator';
import EngineRpmGauge from '../../../components/gauges/EngineRpmGauge';
import EngineTemperatureGauge from '../../../components/gauges/EngineTemperatureGauge';
import EngineOilPressureGauge from '../../../components/gauges/EngineOilPressureGauge';
import EngineFuelGauge from '../../../components/gauges/EngineFuelGauge';
import EngineBatteryVoltageGauge from '../../../components/gauges/EngineBatteryVoltageGauge';
import EngineDashboardFrame from './EngineDashboardFrame';
import EngineDashboardStatus from './EngineDashboardStatus';

const BOARD_WIDTH = 664;
const BOARD_HEIGHT = 536;

function AlarmPanelGlass() {
    const id = `alarm-glass-${useId().replace(/:/g, '')}`;
    return <View pointerEvents="none" accessible={false}
        style={[styles.metalBackground, { margin: 4, borderRadius: 8 }]}>
        <Svg width="100%" height="100%" viewBox="0 0 370 105" preserveAspectRatio="none">
            <Defs>
                <LinearGradient id={id} x1="0%" y1="0%" x2="30%" y2="100%">
                    <Stop offset="0" stopColor="#fff" stopOpacity="0.18" />
                    <Stop offset="0.55" stopColor="#fff" stopOpacity="0.06" />
                    <Stop offset="1" stopColor="#fff" stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id={`${id}-edge`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0" stopColor="#fff" stopOpacity="0.4" />
                    <Stop offset="0.5" stopColor="#fff" stopOpacity="0.03" />
                    <Stop offset="1" stopColor="#fff" stopOpacity="0.14" />
                </LinearGradient>
            </Defs>
            <Path d="M0 0H370V15C240 28 145 56 0 65Z" fill={`url(#${id})`} />
            <Rect x="1" y="1" width="368" height="103" rx="8" fill="none"
                stroke={`url(#${id}-edge)`} strokeWidth="1.2" />
        </Svg>
    </View>;
}

function AluminiumAlarmFrame() {
    const id = `alarm-frame-${useId().replace(/:/g, '')}`;
    return <View pointerEvents="none" accessible={false} style={[styles.metalBackground, { borderRadius: 11 }]}>
        <Svg width="100%" height="100%">
            <Defs>
                <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0" stopColor="#e0e0e0" />
                    <Stop offset="0.3" stopColor="#a0a0a0" />
                    <Stop offset="0.55" stopColor="#666666" />
                    <Stop offset="0.8" stopColor="#bcbcbc" />
                    <Stop offset="1" stopColor="#727272" />
                </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx="11" fill="#191b1d" stroke={`url(#${id})`} strokeWidth="6" />
        </Svg>
    </View>;
}

function BlackAluminiumBackground({ borderRadius = 17 }) {
    const id = useId().replace(/:/g, '');
    return <View pointerEvents="none" accessible={false} style={[styles.metalBackground, { borderRadius }]}>
        <Svg width="100%" height="100%">
            <Defs>
                <LinearGradient id={`${id}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0" stopColor="#151719" />
                    <Stop offset="0.42" stopColor="#303335" />
                    <Stop offset="0.68" stopColor="#1c1e20" />
                    <Stop offset="1" stopColor="#0e1012" />
                </LinearGradient>
                <Pattern id={`${id}-grain`} width="160" height="8" patternUnits="userSpaceOnUse">
                    <Path d="M0 0.5H160 M22 3.5H118 M0 6.5H72 M104 6.5H160" stroke="#fff" strokeOpacity="0.045" strokeWidth="0.6" />
                    <Path d="M0 1.5H132 M54 4.5H160 M0 7.5H160" stroke="#000" strokeOpacity="0.22" strokeWidth="0.7" />
                </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${id}-metal)`} />
            <Rect width="100%" height="100%" fill={`url(#${id}-grain)`} />
        </Svg>
    </View>;
}

export default function EngineDashboard({ connected, engineRunning, navigation, settings, onClose }) {
    const { t } = useTranslation();
    const scale = useControlScale();
    const { width, height } = useWindowDimensions();
    const panelWidth = Math.min(width - 32, (BOARD_WIDTH + 40) * scale);
    const boardScale = Math.max(0.01, Math.min(scale, (panelWidth - 40 * scale) / BOARD_WIDTH,
        (height - 32 - 40 * scale - 2) / BOARD_HEIGHT));
    const gaugeSize = 360 * boardScale;
    const smallGaugeSize = 184 * boardScale;
    const bezelWidth = gaugeSize * 0.06;
    const alarms = [
        { id: 'coolant',
            indicator: <WaterTemperatureAlarmIndicator connected={connected} temperatureAlarm={navigation?.waterTemperatureAlarm} /> },
        { id: 'oil',
            indicator: <OilPressureAlarmIndicator connected={connected} oilPressureAlarm={navigation?.oilPressureAlarm} /> },
        { id: 'alternator',
            indicator: <AlternatorChargeAlarmIndicator connected={connected} alternatorChargeAlarm={navigation?.alternatorChargeAlarm} /> },
        { id: 'battery',
            indicator: <LowBatteryAlarmIndicator connected={connected} lowBatteryAlarm={navigation?.lowBatteryAlarm} /> },
        { id: 'fuel',
            indicator: <LowFuelAlarmIndicator connected={connected} fuelPercent={navigation?.fuelLevelPercent}
                threshold={settings?.lowFuelAlarmPercent} /> },
    ];
    return <Modal transparent visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
        <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose}
                accessibilityRole="button" accessibilityLabel={t('closeEngineDashboard')} />
            <View role="dialog" aria-modal accessibilityViewIsModal accessibilityLabel={t('engineDashboardTitle')}
                onAccessibilityEscape={onClose}
                style={[styles.panel, { width: panelWidth, padding: 20 * scale }]}>
                <BlackAluminiumBackground />
                <EngineDashboardFrame scale={scale} />
                    <Pressable accessibilityRole="button" accessibilityLabel={t('closeEngineDashboard')}
                        onPress={onClose} style={[styles.close, { width: 32 * scale, height: 32 * scale,
                            top: 34 * scale, right: 20 * scale }]}>
                        <Svg accessible={false} width={16 * scale} height={16 * scale} viewBox="0 0 20 20">
                            <Path d="M4 4L16 16M16 4L4 16" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                    </Pressable>
                {/* Five positions: main dial in the centre, small dials at the four corners. */}
                <View style={{ alignSelf: 'center', width: BOARD_WIDTH * boardScale, height: BOARD_HEIGHT * boardScale }}>
                    <EngineDashboardStatus scale={boardScale} connected={connected} engineRunning={engineRunning} />
                    <View style={{ position: 'absolute', left: (BOARD_WIDTH - 360) / 2 * boardScale, top: (BOARD_HEIGHT - 360) / 2 * boardScale }}>
                        <EngineRpmGauge size={gaugeSize} rpm={navigation?.engineRpm} connected={connected} settings={settings} />
                    </View>
                    <View style={{ position: 'absolute', left: 0, top: 0 }}>
                        <EngineTemperatureGauge size={smallGaugeSize} bezelWidth={bezelWidth} temperatureCelsius={navigation?.engineTemperatureCelsius} connected={connected} />
                    </View>
                    <View style={{ position: 'absolute', left: 0, bottom: 0 }}>
                        <EngineOilPressureGauge size={smallGaugeSize} bezelWidth={bezelWidth} pressureBar={navigation?.engineOilPressureBar} connected={connected} />
                    </View>
                    <View style={{ position: 'absolute', right: 0, top: 0 }}>
                        <EngineFuelGauge size={smallGaugeSize} bezelWidth={bezelWidth} fuelLevelPercent={navigation?.fuelLevelPercent}
                            connected={connected} lowFuelAlarmPercent={settings?.lowFuelAlarmPercent} />
                    </View>
                    <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
                        <EngineBatteryVoltageGauge size={smallGaugeSize} bezelWidth={bezelWidth} batteryVoltage={navigation?.batteryVoltage} connected={connected} />
                    </View>
                    <View style={[styles.alarmPanel, { position: 'absolute', bottom: 0,
                        left: (BOARD_WIDTH * boardScale - 370 * scale) / 2, width: 370 * scale,
                        padding: 12 * scale, gap: 10 * scale, transformOrigin: 'bottom center',
                        transform: [{ scale: 0.7 * boardScale / scale }] }]}>
                        <AluminiumAlarmFrame />
                        <Text accessibilityRole="header" style={[styles.alarmTitle, { fontSize: 12 * scale }]}>{t('engineAlarmPanelTitle')}</Text>
                        <View style={[styles.alarms, { gap: 8 * scale }]}>
                            {alarms.map(alarm => <View key={alarm.id}>{alarm.indicator}</View>)}
                        </View>
                        <AlarmPanelGlass />
                    </View>
                </View>
            </View>
            <NightDimmer />
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
    panel: { borderWidth: 1, borderColor: '#707579', borderRadius: 18, backgroundColor: '#1c1e20' },
    metalBackground: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    close: { position: 'absolute', zIndex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.25)' },
    alarmPanel: { flexShrink: 1, minWidth: 0, borderWidth: 1, borderColor: '#737373', borderRadius: 12, backgroundColor: '#191b1d' },
    alarmTitle: { fontFamily: 'NauticalFont', color: '#ffffff' },
    alarms: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
});
