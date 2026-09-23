import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', maxHeight: '90%', backgroundColor: '#1a1a1a', borderRadius: 20, padding: 25 },
    serverInput: { backgroundColor: '#0a1720', color: '#fff', borderWidth: 1, borderColor: '#4b6a7c', borderRadius: 10, padding: 12, marginTop: 8, fontSize: 16 },
    serverHint: { color: '#b5c8d8', fontSize: 13, marginTop: 8 },
    serverSave: { backgroundColor: '#23546a', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
    modalTitle: { color: '#fff', fontSize: 22, textAlign: 'center', marginBottom: 20 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    settingRowContainer: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    settingLabel: { color: '#ccc' },
    valueLabel: { fontWeight: 'bold' },
    slider: { width: '100%', height: 40 },
    divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
    closeBtn: { backgroundColor: '#dc1212', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    closeBtnText: { color: '#fff', fontWeight: 'bold' },
});
