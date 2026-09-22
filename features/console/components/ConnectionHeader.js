import { MaterialIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/consoleStyles';
export default function ConnectionHeader({ isConnected, isNightMode, onOpenSettings }) {
    return (
        <View style={styles.headerRow}>
            <Text style={[styles.statusText, { color: isNightMode ? '#400' : '#666' }]}>
                {isConnected ? '🟢 CONNECTED' : '🔴 NOT CONNECTED'}
            </Text>
            {onOpenSettings && (<TouchableOpacity
                onPress={onOpenSettings}
                accessibilityLabel="Abrir ajustes"
                                >
                <MaterialIcons
                    name="settings"
                    size={40}
                    color={isNightMode ? '#600' : '#aaa'}
                />
            </TouchableOpacity>)}
        </View>
    );
}
