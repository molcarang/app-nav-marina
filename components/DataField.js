import { StyleSheet, Text, View } from 'react-native';

// Campo simple reutilizable; actualmente no se monta en la consola.
const DataField = ({ label, value, color }) => (
  <View style={styles.dataField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={[styles.fieldValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  dataField: { alignItems: 'center' },
  fieldLabel: { color: '#ccc', fontSize: 12 },
  fieldValue: { color: '#fff', fontSize: 24 },
});

export default DataField;
