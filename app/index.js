import { Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConsoleScreen from '../features/console/ConsoleScreen';
import StartupErrorBoundary from '../components/StartupErrorBoundary';

export default function Home() {
    return (
        <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['left', 'right'] : undefined}>
            <StartupErrorBoundary><ConsoleScreen /></StartupErrorBoundary>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
