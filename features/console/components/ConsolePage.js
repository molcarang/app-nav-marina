import { ImageBackground, ScrollView, View } from 'react-native';
import { styles } from '../styles/consoleStyles';
/** Marco y desplazamiento compartidos por las dos páginas. */
export default function ConsolePage({ width, isNightMode, children }) {
    return (
        <View style={[styles.screen, { width, backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View style={[styles.consoleFrame, isNightMode && styles.consoleFrameNight]}>
                <ImageBackground
                    source={require('../../../assets/images/CarbonFiber.png')}
                    style={{ flex: 1, width: '100%' }}
                    resizeMode="repeat"
                    imageStyle={{ borderRadius: 25, opacity: isNightMode ? 0.3 : 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {children}
                    </ScrollView>
                </ImageBackground>
            </View>
        </View>
    );
}
