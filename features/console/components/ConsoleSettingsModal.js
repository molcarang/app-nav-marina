import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { normalizeServerAddress } from '../../../services/signalk/serverAddress.js';
import { styles } from '../styles/settingsStyles';
import HistoryRetentionSetting from './HistoryRetentionSetting';
/** Presenta ajustes; el hook se ocupa de guardarlos. */
export default function ConsoleSettingsModal({ visible, settings, isNightMode, onChange, onSave, onNightModeChange, onClose, onTestDepthSound }) {
    const [address, setAddress] = useState(settings.signalKAddress);
    const [status, setStatus] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (visible) { setAddress(settings.signalKAddress); setStatus(''); }
    }, [visible, settings.signalKAddress]);
    async function saveAddress() {
        setSaving(true);
        setStatus('');
        try {
            const normalized = normalizeServerAddress(address);
            const saved = await onSave('signalKAddress', normalized);
            setStatus(saved ? 'Dirección guardada.' : 'No se pudo guardar. Inténtalo de nuevo.');
        } catch {
            setStatus('Dirección no válida. Ejemplo: http://192.168.1.10:3000');
        } finally { setSaving(false); }
    }
    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>AJUSTES DE CONSOLA</Text>
                    <View style={styles.settingRowContainer}>
                        <Text style={styles.settingLabel}>Servidor Signal K</Text>
                        <TextInput
                            style={styles.serverInput}
                            value={address}
                            onChangeText={value => { setAddress(value); setStatus(''); }}
                            placeholder="http://openplotter.local:3000"
                            placeholderTextColor="#788993"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            editable={!saving}
                            accessibilityLabel="Dirección del servidor Signal K"
                        />
                        <Text style={styles.serverHint}>IP o nombre del servidor y puerto. Ejemplo: 192.168.1.10:3000</Text>
                        <TouchableOpacity disabled={saving} onPress={saveAddress} style={[styles.serverSave, saving && { opacity: 0.5 }]}>
                            <Text style={styles.closeBtnText}>{saving ? 'GUARDANDO…' : 'GUARDAR Y CONECTAR'}</Text>
                        </TouchableOpacity>
                        {!!status && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{status}</Text>}
                    </View>

                    <HistoryRetentionSetting hours={settings.historyHours} visible={visible} onSave={onSave} />
                    <HistoryRetentionSetting metric="SOG" settingKey="sogHistoryHours" hours={settings.sogHistoryHours} visible={visible} onSave={onSave} />

                    {[
            { label: 'Mínimo Ceñida', key: 'minAnguloCeñida', min: 10, max: 45, color: '#00ff00' },
            { label: 'Máximo Ceñida', key: 'maxAnguloCeñida', min: 50, max: 90, color: '#ff0000' },
            { label: 'Alerta de Timón', key: 'rudderLimit', min: 20, max: 45, color: '#00ffff' },
            { label: 'Alarma de profundidad', key: 'depthAlarmMeters', min: 0.5, max: 30, step: 0.1, unit: ' m', color: '#dc1212' }
        ].map(s => (<View
            key={s.key}
            style={styles.settingRowContainer}
                    >
            <View style={styles.labelRow}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={[styles.valueLabel, { color: s.color }]}>
                    {s.key === 'depthAlarmMeters' ? settings[s.key].toFixed(1) : settings[s.key]}{s.unit ?? '°'}
                </Text>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={s.min}
                maximumValue={s.max}
                step={s.step ?? 1}
                value={settings[s.key]}
                onValueChange={(v) => onChange(s.key, v)}
                onSlidingComplete={(v) => onSave(s.key, v)}
                minimumTrackTintColor={s.color}
                thumbTintColor={s.color}
                maximumTrackTintColor="rgba(255,255,255,0.1)"
            />
        </View>))}

                    <View style={styles.divider}/>
                    <View style={styles.settingRowContainer}>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Sonido de alarma de profundidad</Text>
                            <Switch value={settings.depthAlarmSound} onValueChange={value => onSave('depthAlarmSound', value)}
                                trackColor={{ false: '#333', true: '#dc1212' }} />
                        </View>
                        <Text style={styles.serverHint}>Aviso repetido mientras la profundidad esté por debajo del límite. En web, toca la pantalla para habilitar el audio.</Text>
                        <TouchableOpacity onPress={onTestDepthSound} style={styles.serverSave}>
                            <Text style={styles.closeBtnText}>PROBAR SONIDO</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Modo Noche</Text>
                        <Switch
                            value={isNightMode}
                            onValueChange={onNightModeChange}
                            trackColor={{ false: "#333", true: "#dc1212" }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                    >
                        <Text style={styles.closeBtnText}>CERRAR</Text>
                    </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
