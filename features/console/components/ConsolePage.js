import { ScrollView, View } from 'react-native';
import { styles } from '../styles/consoleStyles';
import ConsoleBackground from './ConsoleBackground';
/** Marco y desplazamiento compartidos por las dos páginas. */
export default function ConsolePage({ width, isNightMode, children }) {
    return (
        <View style={[styles.screen, { width, backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View style={[styles.consoleFrame, isNightMode && styles.consoleFrameNight]}>
                <View style={{ flex: 1, width: '100%', borderRadius: 25, overflow: 'hidden' }}>
                    <ConsoleBackground isNightMode={isNightMode} />
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {children}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}
