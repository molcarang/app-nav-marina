import { useContext, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { GAUGE_THEME } from '../../../styles/GaugeTheme';
import { EngineHoursContext } from '../hooks/useEngineHours';
import { CONSUMPTION_PANEL_WIDTH } from './EngineConsumptionPanel';

export const ENGINE_HOURS_PANEL_HEIGHT = 88;

function OdometerWheel({ positionValue, scale, accent = false }) {
    const height = 27 * scale;
    const width = 19 * scale;
    const position = useRef(new Animated.Value(positionValue)).current;
    const previous = useRef(positionValue);
    useEffect(() => {
        if (positionValue === previous.current) return;
        const from = previous.current;
        const to = positionValue <= from ? positionValue + 10 : positionValue;
        position.setValue(from);
        const animation = Animated.timing(position, { toValue: to, duration: 520,
            easing: Easing.out(Easing.cubic), useNativeDriver: true });
        animation.start(({ finished }) => {
            if (finished) position.setValue(positionValue);
        });
        previous.current = positionValue;
        return () => animation.stop();
    }, [positionValue, position]);
    return <View style={[styles.wheel, { width, height, borderRadius: 2 * scale },
        accent && styles.wheelAccent]}>
        <Animated.View style={{ transform: [{ translateY: Animated.multiply(position, -height) }] }}>
            {Array.from({ length: 20 }, (_, number) => <Text key={number}
                style={[styles.wheelDigit, { width, height, lineHeight: height,
                    fontSize: 17 * scale }, accent && styles.wheelDigitAccent]}>
                {number % 10}
            </Text>)}
        </Animated.View>
        <View pointerEvents="none" style={styles.wheelShine} />
    </View>;
}

function EngineHoursOdometer({ hours, scale }) {
    const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
    const digits = String(Math.floor(safeHours) % 10000).padStart(4, '0').split('').map(Number);
    const tenthsPosition = (safeHours * 10) % 10;
    return <View style={[styles.odometer, { gap: 2 * scale }]}>
        {digits.map((digit, index) => <OdometerWheel key={index} positionValue={digit} scale={scale} />)}
        <Text style={[styles.decimalPoint, { fontSize: 17 * scale, lineHeight: 27 * scale }]}>.</Text>
        <OdometerWheel positionValue={tenthsPosition} scale={scale} accent />
    </View>;
}

export default function EngineHoursPanel({ scale = 1 }) {
    const { t } = useTranslation();
    const { totalHours, ready, error } = useContext(EngineHoursContext);
    const value = ready && Number.isFinite(totalHours) ? totalHours.toFixed(1) : '—';
    return <View testID="engine-hours-panel" accessible
        accessibilityLabel={ready ? t('engineHoursDescription', { value }) : t('engineHoursNoData')}
        style={[styles.panel, { width: CONSUMPTION_PANEL_WIDTH * scale,
            height: ENGINE_HOURS_PANEL_HEIGHT * scale, paddingVertical: 5 * scale,
            paddingHorizontal: 6 * scale, borderRadius: 9 * scale }]}>
        <View pointerEvents="none" style={[styles.innerFrame, {
            top: 2 * scale, right: 2 * scale, bottom: 2 * scale, left: 2 * scale,
            borderRadius: 7 * scale,
        }]} />
        <Text numberOfLines={2}
            style={[styles.title, { fontSize: 11 * scale, lineHeight: 11 * scale, marginTop: 4 * scale }]}>
            {t('engineHoursTitle').replace(' ', '\n')}
        </Text>
        <View style={styles.reading}>
            <View testID="engine-hours-total">
                <EngineHoursOdometer hours={ready ? totalHours : null} scale={scale} />
            </View>
            {!!error && <Text accessibilityLiveRegion="polite"
                style={{ color: '#ffad33', fontSize: 7 * scale, textAlign: 'center' }}>{t(error)}</Text>}
        </View>
    </View>;
}

const styles = StyleSheet.create({
    panel: { backgroundColor: GAUGE_THEME.colors.bg, borderWidth: 2, borderColor: '#aeb4b8' },
    innerFrame: { position: 'absolute', borderWidth: 1, borderColor: '#50585d' },
    title: { color: '#ff9800', fontFamily: 'NauticalFont', textAlign: 'center', width: '100%' },
    reading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    odometer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
    wheel: { overflow: 'hidden', backgroundColor: '#080a0b', borderWidth: 1, borderColor: '#646b70' },
    wheelAccent: { backgroundColor: '#8f1717', borderColor: '#d14949' },
    wheelDigit: { color: '#f4f5f5', fontFamily: 'NauticalFont', textAlign: 'center' },
    wheelDigitAccent: { color: '#ffffff' },
    wheelShine: { ...StyleSheet.absoluteFillObject, borderTopWidth: 2, borderBottomWidth: 2,
        borderTopColor: 'rgba(255,255,255,0.18)', borderBottomColor: 'rgba(0,0,0,0.75)' },
    decimalPoint: { color: '#bdcbd5', fontFamily: 'NauticalFont', lineHeight: 21 },
});
