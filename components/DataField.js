const DataField = ({ label, value, color }) => (
  <View style={styles.dataField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={[styles.fieldValue, { color }]}>{value}</Text>
  </View>
);