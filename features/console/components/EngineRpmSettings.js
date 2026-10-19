import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { useResponsiveStyles } from '../../../hooks/useControlScale';
import { styles as baseStyles } from '../styles/settingsStyles';

export default function EngineRpmSettings({ settings, visible, onSave }) {
    const { t } = useTranslation();
    const styles = useResponsiveStyles(baseStyles);
    const [maximum, setMaximum] = useState(String(settings.tachometerMaxRpm));
    const [redZone, setRedZone] = useState(String(settings.tachometerRedZoneRpm));
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setMaximum(String(settings.tachometerMaxRpm));
        setRedZone(String(settings.tachometerRedZoneRpm));
        setMessage('');
    }, [settings.tachometerMaxRpm, settings.tachometerRedZoneRpm, visible]);
    async function save() {
        const max = Number(maximum);
        const red = Number(redZone);
        if (!maximum.trim() || !redZone.trim() || !Number.isInteger(max) || max < 1000 || max > 20000
            || !Number.isInteger(red) || red < 0 || red > 20000) {
            setMessage('tachometerSettingsInvalid');
            return;
        }
        if (max < red) {
            setMessage('tachometerMaximumBelowRedZone');
            return;
        }
        setSaving(true);
        try {
            const saved = await onSave('engineRpmSettings', { tachometerMaxRpm: max, tachometerRedZoneRpm: red });
            setMessage(saved ? 'tachometerSettingsSaved' : 'saveError');
        } catch { setMessage('saveError'); }
        finally { setSaving(false); }
    }
    return <View style={styles.settingRowContainer}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
                { label: 'tachometerMaxRpm', value: maximum, change: setMaximum },
                { label: 'tachometerRedZoneRpm', value: redZone, change: setRedZone },
            ].map(field => <View key={field.label} style={{ flexGrow: 1, flexBasis: 220 }}>
                <Text style={styles.settingLabel}>{t(field.label)} (RPM)</Text>
                <TextInput accessibilityLabel={t(field.label)} keyboardType="number-pad" maxLength={5}
                    style={styles.serverInput} value={field.value} editable={!saving}
                    onChangeText={value => { field.change(value); setMessage(''); }} />
            </View>)}
        </View>
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save}
            style={[styles.serverSave, saving && { opacity: 0.5 }]}>
            <Text style={styles.closeBtnText}>{t(saving ? 'saving' : 'saveTachometerSettings')}</Text>
        </TouchableOpacity>
        {!!message && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{t(message)}</Text>}
    </View>;
}
