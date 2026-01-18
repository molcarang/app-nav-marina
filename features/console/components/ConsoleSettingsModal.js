import Slider from '@react-native-community/slider';
import { Modal, Switch, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/settingsStyles';
/** Presenta ajustes; el hook se ocupa de guardarlos. */
export default function ConsoleSettingsModal({ visible, settings, isNightMode, onChange, onSave, onNightModeChange, onClose }) {
    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>AJUSTES DE CONSOLA</Text>

                    {[
            { label: 'Mínimo Ceñida', key: 'minAnguloCeñida', min: 10, max: 45, color: '#00ff00' },
            { label: 'Máximo Ceñida', key: 'maxAnguloCeñida', min: 50, max: 90, color: '#ff0000' },
            { label: 'Alerta de Timón', key: 'rudderLimit', min: 20, max: 45, color: '#00ffff' }
        ].map(s => (<View
            key={s.key}
            style={styles.settingRowContainer}
                    >
            <View style={styles.labelRow}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={[styles.valueLabel, { color: s.color }]}>
                    {settings[s.key] || (s.key === 'rudderLimit' ? 35 : 0)}°
                </Text>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={s.min}
                maximumValue={s.max}
                step={1}
                value={settings[s.key] || (s.key === 'rudderLimit' ? 35 : 0)}
                onValueChange={(v) => onChange(s.key, v)}
                onSlidingComplete={(v) => onSave(s.key, v)}
                minimumTrackTintColor={s.color}
                thumbTintColor={s.color}
                maximumTrackTintColor="rgba(255,255,255,0.1)"
            />
        </View>))}

                    <View style={styles.divider}/>

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
                </View>
            </View>
        </Modal>
    );
}
