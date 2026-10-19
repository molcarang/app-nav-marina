import { Pressable, StyleSheet, View } from 'react-native';
import { useControlScale } from '../../../hooks/useControlScale';

export default function StatusIndicator({ active, label, icon: Icon, alarm = false, alarmColor = '#ff2020', onPress, hint }) {
    const scale = useControlScale();
    const color = active ? (alarm ? alarmColor : '#ff9800') : '#68747e';
    const Container = onPress ? Pressable : View;
    const disabled = !onPress && !active;
    return <Container accessible accessibilityRole={onPress ? 'button' : 'image'} accessibilityLiveRegion="polite"
        onPress={onPress} accessibilityLabel={label} accessibilityHint={hint}
        accessibilityState={{ disabled }} aria-disabled={disabled}
        style={[styles.indicator, { width: 62.4 * scale, height: 54.6 * scale, borderWidth: alarm ? 3 * scale : 1 },
            alarm ? { borderColor: active ? color : '#364149', backgroundColor: '#101820', shadowColor: '#000' }
                : active ? { borderColor: color, backgroundColor: '#2b2115', shadowColor: color } : styles.inactive]}>
        <View pointerEvents="none" style={styles.highlight} />
        <Icon size={46.8 * scale} color={color} />
    </Container>;
}

const styles = StyleSheet.create({
    indicator: { borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
    inactive: { borderColor: '#364149', backgroundColor: '#101820', opacity: 0.5 },
    highlight: { position: 'absolute', top: 1, left: 8, right: 8, height: 1, backgroundColor: 'rgba(255, 234, 160, 0.16)' },
});
