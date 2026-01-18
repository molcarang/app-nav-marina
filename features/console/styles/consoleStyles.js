import { Platform, StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#000' },
    screen: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    scrollContent: { alignItems: 'center', paddingBottom: 45 },
    consoleFrame: { alignSelf: 'center', width: '96%', height: '98%', borderRadius: 28, backgroundColor: '#111', borderWidth: 2, borderColor: '#333', overflow: 'hidden' },
    consoleFrameNight: { borderColor: '#400' },
    dataGrid: { width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingVertical: 10, alignItems: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', width: '92%', alignSelf: 'center', marginBottom: 15 },
    statusText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'NauticalFont' },
    row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', marginBottom: 8 },
});
