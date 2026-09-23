import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MAX_HISTORY_HOURS } from '../model/twsHistory.js';
import { styles } from '../styles/settingsStyles';

export default function HistoryRetentionSetting({ hours, visible, onSave, metric = 'TWS', settingKey = 'historyHours' }) {
    const [draft, setDraft] = useState(String(hours));
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => { setDraft(String(hours)); }, [hours, visible]);
    async function save() {
        const value = Number(draft);
        if (!draft.trim() || !Number.isInteger(value) || value < 1 || value > MAX_HISTORY_HOURS) {
            setMessage(`Introduce un número entero entre 1 y ${MAX_HISTORY_HOURS}.`);
            return;
        }
        setSaving(true);
        try {
            const saved = await onSave(settingKey, value);
            setMessage(saved ? 'Duración guardada y aplicada.' : 'No se pudo guardar. Inténtalo de nuevo.');
        } catch { setMessage('No se pudo guardar. Inténtalo de nuevo.'); }
        finally { setSaving(false); }
    }
    return (
        <View style={styles.settingRowContainer}>
            <Text style={styles.settingLabel}>Horas de historial {metric}</Text>
            <TextInput style={styles.serverInput} value={draft}
                onChangeText={text => { setDraft(text); setMessage(''); }}
                keyboardType="number-pad" editable={!saving} maxLength={2}
                accessibilityLabel={`Horas de historial ${metric} a conservar`} />
            <Text style={styles.serverHint}>De 1 a {MAX_HISTORY_HOURS} horas. Por defecto: 2. Al reducirlas se eliminan las muestras más antiguas.</Text>
            <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save}
                style={[styles.serverSave, saving && { opacity: 0.5 }]}>
                <Text style={styles.closeBtnText}>{saving ? 'GUARDANDO…' : 'GUARDAR HORAS'}</Text>
            </TouchableOpacity>
            {!!message && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{message}</Text>}
        </View>
    );
}
