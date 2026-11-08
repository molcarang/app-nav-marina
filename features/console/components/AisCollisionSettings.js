import { useEffect, useState } from 'react';
import { Text, View, Switch, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from '../../../localization/LanguageProvider';
import { useResponsiveStyles } from '../../../hooks/useControlScale';
import { styles as baseStyles } from '../styles/settingsStyles';
import { normalizeAisCollisionSettings } from '../model/aisCollisionRisk.js';

export default function AisCollisionSettings({ settings, visible, onSave }) {
    const { t } = useTranslation();
    const styles = useResponsiveStyles(baseStyles);
    const [draft, setDraft] = useState(() => normalizeAisCollisionSettings(settings));
    const [status, setStatus] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (visible) setDraft(normalizeAisCollisionSettings(settings)); }, [settings, visible]);
    useEffect(() => { if (visible) setStatus(''); }, [visible]);
    const change = (key, value) => {
        setDraft(old => normalizeAisCollisionSettings({ ...old, [key]: value }));
        setStatus('');
    };
    const sliders = [
        ['aisWarningCpaNm', 'aisWarningDistance', 0.05, 5, 0.05, '#ffad33'],
        ['aisWarningTcpaMinutes', 'aisWarningTime', 1, 60, 1, '#ffad33'],
        ['aisDangerCpaNm', 'aisDangerDistance', 0.05, draft.aisWarningCpaNm, 0.05, '#ff4545'],
        ['aisDangerTcpaMinutes', 'aisDangerTime', 1, draft.aisWarningTcpaMinutes, 1, '#ff4545'],
    ];
    async function save() {
        setSaving(true);
        try { setStatus(await onSave('aisCollisionSettings', draft) ? 'aisRiskSaved' : 'saveError'); }
        catch { setStatus('saveError'); }
        finally { setSaving(false); }
    }
    return <View>
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('aisRiskEnabled')}</Text>
            <Switch accessibilityLabel={t('aisRiskEnabled')} value={draft.aisCollisionEnabled}
                onValueChange={value => change('aisCollisionEnabled', value)} disabled={saving} />
        </View>
        <Text style={[styles.serverHint, { marginBottom: 18 }]}>{t('aisRiskLimitsHint')}</Text>
        {sliders.map(([key, label, min, max, step, color]) => <View key={key} style={styles.settingRowContainer}>
            <View style={styles.labelRow}>
                <Text style={[styles.settingLabel, { flex: 1 }]}>{t(label)}</Text>
                <Text style={[styles.valueLabel, { color }]}>{key.endsWith('Nm') ? `${draft[key].toFixed(2)} NM` : `${draft[key]} min`}</Text>
            </View>
            <Slider accessibilityLabel={t(label)} minimumValue={min} maximumValue={max} step={step}
                value={draft[key]} onValueChange={value => change(key, value)} disabled={saving}
                style={styles.slider} minimumTrackTintColor={color} thumbTintColor={color} />
        </View>)}
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save} style={styles.serverSave}>
            <Text style={styles.closeBtnText}>{t(saving ? 'saving' : 'aisRiskSave')}</Text>
        </TouchableOpacity>
        {!!status && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{t(status)}</Text>}
        <View style={{ height: 18 }} />
    </View>;
}
