import { useTranslation } from '../../localization/LanguageProvider';
import { getLanguageLocale } from '../../localization/translate';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import NightDimmer from '../NightDimmer';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';
import { getHistoryChart } from './historyPath';
import { historyWindowMs, getHistoryExtrema } from '../../features/console/model/twsHistory.js';

export default function HistoryChartModal({ visible, onClose, history, label, unit, value, maxValue, isNightMode, historyHours = 2 }) {
    const { t, language } = useTranslation();
    const { width, height } = useWindowDimensions();
    const accent = isNightMode ? '#bc7777' : '#79f17b';
    const foreground = isNightMode ? '#c49797' : '#eaf2f8';
    const plotWidth = 550;
    const plotHeight = 220;
    const now = Date.now();
    const windowMs = historyWindowMs(historyHours);
    const windowStart = now - windowMs;
    const extrema = getHistoryExtrema(history, now, historyHours);
    const range = Math.max(1, Number(maxValue) || 0, extrema.max?.value ?? 0);
    const minimum = extrema.min?.value.toFixed(1) ?? '—';
    const maximum = extrema.max?.value.toFixed(1) ?? '—';
    const sampleTime = sample => Number.isFinite(sample?.time)
        ? new Date(sample.time).toLocaleTimeString(getLanguageLocale(language), { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
    const quarterHourMs = 15 * 60 * 1000;
    const firstQuarter = new Date(windowStart);
    firstQuarter.setMinutes(Math.floor(firstQuarter.getMinutes() / 15) * 15, 0, 0);
    if (firstQuarter.getTime() < windowStart) firstQuarter.setTime(firstQuarter.getTime() + quarterHourMs);
    const timeSeparators = [];
    for (let time = firstQuarter.getTime(); time <= now; time += quarterHourMs) {
        timeSeparators.push({ time, x: (time - windowStart) / windowMs * plotWidth });
    }
    const chart = getHistoryChart(history, plotWidth, plotHeight, range, now, historyHours);
    const timeLabel = time => new Date(time).toLocaleTimeString(getLanguageLocale(language), { hour: '2-digit', minute: '2-digit' });

    return (
        <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View accessibilityViewIsModal style={[styles.panel, {
                    width: Math.min(900, width * 0.94), maxHeight: height * 0.9,
                    backgroundColor: isNightMode ? '#170b0b' : '#0c1b27',
                    borderColor: isNightMode ? '#684444' : '#4b6a7c',
                }]}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        <Text accessibilityRole="header" style={[styles.title, { color: foreground }]}>{t('historyHeading', { metric: label })}</Text>
                        <Text style={[styles.reading, { color: accent }]}>{value} {unit}</Text>
                        <View style={styles.extremaRow}>
                            {[{ title: t('maximum'), value: maximum, time: sampleTime(extrema.max), color: isNightMode ? '#c49797' : '#ffd070' },
                                { title: t('minimum'), value: minimum, time: sampleTime(extrema.min), color: isNightMode ? '#b38b8b' : '#80d7ed' }].map(item => (
                                <View key={item.title} style={[styles.extremaBadge, { borderColor: item.color }]}>
                                    <Text style={[styles.extremaLabel, { color: item.color }]}>{item.title}</Text>
                                    <Text style={[styles.extremaValue, { color: foreground }]}>{item.value} {unit}</Text>
                                    <Text style={[styles.extremaTime, { color: foreground }]}>{item.time}</Text>
                                </View>
                            ))}
                        </View>
                        {history.length > 1 ? (
                            <Svg width="100%" height={Math.max(150, Math.min(330, height * 0.48))} viewBox="0 0 640 280"
                                accessible accessibilityLabel={t('historyDescription', { metric: label, count: history.length, range: range.toFixed(1), unit })}>
                                <G transform="translate(65, 16)">
                                    {timeSeparators.map(({ time, x }) => (
                                        <Line key={time} x1={x} y1={0} x2={x} y2={plotHeight}
                                            stroke={foreground} strokeWidth={1} opacity={0.2} />
                                    ))}
                                    {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
                                        const y = plotHeight - fraction * (plotHeight - 5);
                                        return <G key={fraction}>
                                            <Line x1={0} y1={y} x2={plotWidth} y2={y} stroke={foreground} opacity={0.15} />
                                            <SvgText x={-10} y={y + 4} textAnchor="end" fill={foreground} fontSize={12} fontFamily="NauticalFont">{(range * fraction).toFixed(1)}</SvgText>
                                        </G>;
                                    })}
                                    <Path d={chart.area} fill={accent} opacity={0.12} />
                                    <Path d={chart.line} fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
                                    {[0, 0.5, 1].map(fraction => (
                                        <SvgText key={fraction} x={plotWidth * fraction} y={246} textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'} fill={foreground} fontSize={12} fontFamily="NauticalFont">
                                            {timeLabel(now - historyWindowMs(historyHours) * (1 - fraction))}
                                        </SvgText>
                                    ))}
                                </G>
                            </Svg>
                        ) : <Text style={[styles.empty, { color: foreground }]}>{t('historyWaiting')}</Text>}
                        <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.close}>
                            <Text style={styles.closeText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
                <NightDimmer />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
    panel: { borderWidth: 1, borderRadius: 20, padding: 18 },
    title: { fontFamily: 'NauticalFont', fontSize: 17, textAlign: 'center' },
    reading: { fontFamily: 'NauticalFont', fontSize: 24, textAlign: 'center', marginVertical: 12 },
    extremaRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 14 },
    extremaBadge: { flex: 1, maxWidth: 230, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)' },
    extremaLabel: { fontFamily: 'NauticalFont', fontSize: 11, marginBottom: 5 },
    extremaValue: { fontFamily: 'NauticalFont', fontSize: 14, textAlign: 'center' },
    extremaTime: { fontFamily: 'NauticalFont', fontSize: 11, textAlign: 'center', marginTop: 6, opacity: 0.8 },
    empty: { fontFamily: 'NauticalFont', paddingVertical: 35, textAlign: 'center' },
    close: { backgroundColor: '#943030', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
    closeText: { color: '#fff', fontFamily: 'NauticalFont', fontSize: 12 },
});
