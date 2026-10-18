import { useContext, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useTranslation } from '../../../localization/LanguageProvider';
import { isValidPosition, formatCoordinate } from '../model/gpsPosition.js';
import { estimateAnchor, hasFreshAnchorPosition, parseAnchorNumber, validAnchorDraft } from '../model/anchor.js';
import { projectAisPosition } from '../../../components/gauges/shared/aisProjection.js';

import { AnchorWatchContext } from '../hooks/useAnchorWatch';

const STORAGE_KEY = '@anchor_preparation_v1';

export default function AnchorSetupModal({ visible, onClose, position, receivedAt, connected }) {
    const { t } = useTranslation();
    const watch = useContext(AnchorWatchContext);
    const { width, height } = useWindowDimensions();
    const wide = width > height;
    const compact = height < 480;
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => { show.remove(); hide.remove(); };
    }, []);
    const previewHeight = wide ? Math.max(80, Math.min(170, height - 200))
        : Math.max(70, Math.min(150, height - 530));
    const [mode, setMode] = useState(null);
    const [method, setMethod] = useState('estimate');
    const [center, setCenter] = useState(null);
    const [radius, setRadius] = useState('50');
    const [distance, setDistance] = useState('30');
    const [bearing, setBearing] = useState('0');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [notice, setNotice] = useState('');
    const [ready, setReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (!visible) return;
        let active = true;
        setReady(false);
        AsyncStorage.getItem(STORAGE_KEY).then(raw => {
            if (!active) return;
            const draft = raw ? JSON.parse(raw) : null;
            if (validAnchorDraft(draft)) {
                setMode(draft.method === 'drop' ? 'drop' : 'already');
                setMethod(draft.method === 'drop' ? 'estimate' : draft.method);
                setCenter(draft.center);
                setLatitude(String(draft.center.latitude));
                setLongitude(String(draft.center.longitude));
                setRadius(String(draft.radius));
            }
        }).catch(() => { if (active) setNotice('anchorLoadError'); })
            .finally(() => { if (active) setReady(true); });
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => { active = false; clearInterval(timer); };
    }, [visible]);
    // El temporizador fuerza la caducidad, pero una nueva lectura puede llegar entre ticks.
    const fresh = hasFreshAnchorPosition(position, receivedAt, connected, Math.max(now, Date.now()));
    const selectedMethod = mode === 'drop' ? 'drop' : method;
    const draft = { method: selectedMethod, center, radius: parseAnchorNumber(radius) };
    const valid = validAnchorDraft(draft);
    const changeMethod = next => {
        if (center) { setLatitude(String(center.latitude)); setLongitude(String(center.longitude)); }
        setMethod(next); setCenter(null); setNotice('');
    };
    const capture = () => {
        setNotice('');
        if (selectedMethod === 'manual') {
            const point = { latitude: parseAnchorNumber(latitude), longitude: parseAnchorNumber(longitude) };
            if (!isValidPosition(point)) { setNotice('anchorInvalid'); return; }
            setCenter(point);
        } else {
            if (!fresh) { setNotice('anchorGpsNeeded'); return; }
            const point = selectedMethod === 'estimate'
                ? estimateAnchor(position, parseAnchorNumber(distance), parseAnchorNumber(bearing)) : { ...position };
            if (!point) { setNotice('anchorInvalid'); return; }
            setCenter(point);
        }
    };
    const save = async () => {
        if (!valid || saving) return;
        setSaving(true);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
            if (await watch.activate(draft)) onClose();
        }
        catch { setNotice('anchorSaveError'); }
        finally { setSaving(false); }
    };
    const boat = fresh && center ? projectAisPosition(center, position, 0, 100000, 100000) : null;
    const boatMeters = boat ? boat.distanceNm * 1852 : null;
    const extent = Math.max(valid ? draft.radius : 50, boatMeters ?? 0, 10) * 1.2;
    const plotScale = 90 / extent;
    const button = (key, action, selected = false, disabled = false) => <TouchableOpacity key={key}
        accessibilityRole="button" accessibilityState={{ disabled, selected }} disabled={disabled || !ready}
        onPress={() => { Keyboard.dismiss(); action(); }} style={[styles.button, compact && styles.compactButton, selected && styles.selected, (disabled || !ready) && { opacity: 0.4 }]}>
        <Text style={[styles.text, compact && styles.compactText]}>{t(key)}</Text>
    </TouchableOpacity>;
    const input = (key, value, setter) => <View style={styles.field}>
        <Text style={[styles.text, compact && styles.compactText]}>{t(key)}</Text>
        <TextInput accessibilityLabel={t(key)} value={value} keyboardType="numbers-and-punctuation"
            onChangeText={text => { setter(text); setNotice(''); if (key !== 'anchorRadius') setCenter(null); }}
            style={styles.input} />
    </View>;
    return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.panel, compact && styles.compactPanel]} accessibilityViewIsModal>
            <View style={styles.header}>
                <Text style={[styles.text, styles.title]}>{t('anchorButton')}</Text>
                <Text style={[styles.warning, { flex: 1 }]}>{t('anchorForeground')}</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => { Keyboard.dismiss(); onClose(); }}
                    style={[styles.button, compact && styles.compactButton]}>
                    <Text style={styles.text}>{t('anchorClose')}</Text>
                </TouchableOpacity>
            </View>
            {!keyboardVisible && <View style={[styles.selectors, wide && styles.horizontal]}>
                <View style={styles.row}>
                    {button('anchorDrop', () => { setMode('drop'); setCenter(null); setNotice(''); }, mode === 'drop')}
                    {button('anchorAlready', () => {
                        if (center) { setLatitude(String(center.latitude)); setLongitude(String(center.longitude)); }
                        setMode('already'); setCenter(null); setNotice('');
                    }, mode === 'already')}
                </View>
                {mode === 'already' && <View style={styles.row}>
                    {['estimate', 'manual'].map(option => button(`anchorMethod_${option}`, () => changeMethod(option), method === option))}
                </View>}
            </View>}
            {mode && <View style={[styles.body, wide && styles.horizontal]}>
                <View style={[styles.configuration, !wide && { flexBasis: 'auto' }]}>
                    {!keyboardVisible && <Text style={[styles.text, styles.help, compact && styles.compactText]}>{t(`anchorHelp_${selectedMethod}`)}</Text>}
                    {selectedMethod === 'estimate' && <View style={styles.row}>
                        {input('anchorDistance', distance, setDistance)}{input('anchorBearing', bearing, setBearing)}
                    </View>}
                    {selectedMethod === 'manual' && <View style={styles.row}>
                        {input('anchorLatitude', latitude, setLatitude)}{input('anchorLongitude', longitude, setLongitude)}
                    </View>}
                    <View style={[styles.row, { alignItems: 'flex-end' }]}>
                        {input('anchorRadius', radius, setRadius)}
                        {button('anchorSetPoint', capture, false, selectedMethod !== 'manual' && !fresh)}
                    </View>
                    {!fresh && <Text style={styles.warning}>{t('anchorGpsNeeded')}</Text>}
                    {!!notice && <Text accessibilityLiveRegion="polite" style={styles.warning}>{t(notice)}</Text>}
                </View>
                {center && !keyboardVisible && <View style={[styles.preview, wide && { flex: 1 }]}>
                    <Text style={[styles.text, styles.coordinates]}>{formatCoordinate(center.latitude, true)}{' / '}{formatCoordinate(center.longitude, false)}</Text>
                    <Svg width="100%" height={previewHeight} viewBox="0 0 300 210" accessible={false}>
                            <Circle cx={150} cy={105} r={valid ? draft.radius * plotScale : 0} fill="#16384b" stroke="#8fcbdc" strokeDasharray="4 4" />
                            <Line x1={150} y1={95} x2={150} y2={115} stroke="#fff" />
                            <Line x1={140} y1={105} x2={160} y2={105} stroke="#fff" />
                            <SvgText x={150} y={14} fill="#8fcbdc" textAnchor="middle" fontFamily="NauticalFont">N</SvgText>
                            {boat && <Polygon points="0,-6 5,6 -5,6" fill={boatMeters > draft.radius ? '#ef6b72' : '#45d39a'}
                                transform={`translate(${150 + boat.x * 1852 * plotScale}, ${105 + boat.y * 1852 * plotScale})`} />}
                        </Svg>
                    <Text style={styles.text}>{t('anchorCurrentDistance', { distance: boatMeters === null ? '\u2014' : boatMeters.toFixed(1) })}</Text>
                    {valid && boatMeters > draft.radius && <Text style={styles.warning}>{t('anchorOutside')}</Text>}
                </View>}
            </View>}
            {!mode && !!notice && <Text accessibilityLiveRegion="polite" style={styles.warning}>{t(notice)}</Text>}
            {mode && <View style={styles.footer}>
                {!valid && !notice && <Text style={[styles.warning, { flex: 1 }]}>{t('anchorValidDraft')}</Text>}
                {button('anchorSaveDraft', save, false, !valid || saving || !watch.ready || !fresh)}
            </View>}
        </View>
        </KeyboardAvoidingView>
    </Modal>;
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)' },
    panel: { width: '100%', maxWidth: 980, maxHeight: '100%', padding: 12, gap: 10, backgroundColor: '#10202c', borderRadius: 18, borderWidth: 1, borderColor: '#58788b' },
    compactPanel: { padding: 8, gap: 6 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    selectors: { gap: 6 },
    body: { gap: 10, flexShrink: 1 },
    horizontal: { flexDirection: 'row', alignItems: 'flex-start' },
    configuration: { flexGrow: 1, flexBasis: 0, gap: 8, minWidth: 0 },
    row: { flexDirection: 'row', gap: 6, alignItems: 'stretch' },
    field: { flex: 1, gap: 3, minWidth: 0 },
    text: { fontFamily: 'NauticalFont', color: '#8fcbdc', fontSize: 12 },
    compactText: { fontSize: 11 },
    title: { fontSize: 18 },
    help: { fontSize: 11, lineHeight: 15 },
    warning: { fontFamily: 'NauticalFont', color: '#e4bb78', fontSize: 11 },
    button: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#58788b' },
    compactButton: { minHeight: 36, paddingHorizontal: 8, paddingVertical: 4 },
    selected: { backgroundColor: '#173e33', borderColor: '#45d39a' },
    input: { fontFamily: 'NauticalFont', fontSize: 13, color: '#fff', backgroundColor: '#081722', paddingHorizontal: 8, paddingVertical: 5, minHeight: 36, borderRadius: 8, borderColor: '#58788b', borderWidth: 1 },
    preview: { alignItems: 'center', gap: 3, minWidth: 0, flexShrink: 1 },
    coordinates: { fontSize: 10, textAlign: 'center' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
});
