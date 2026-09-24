import { useTranslation } from '../../../localization/LanguageProvider';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function AisToggleButton({ visible, onPress }) {
    const { t } = useTranslation();
    const color = visible ? '#45d39a' : '#aaa';
    return <TouchableOpacity onPress={onPress} accessibilityRole="switch"
        accessibilityState={{ checked: visible }} accessibilityLabel={t(visible ? 'hideAis' : 'showAis')}
        style={[styles.button, { borderColor: color }]}>
        <Text style={[styles.text, { color }]}>{t('aisData')}</Text>
    </TouchableOpacity>;
}

const styles = StyleSheet.create({
    button: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10,
        borderWidth: 1, backgroundColor: '#10202c', alignSelf: 'flex-start' },
    text: { fontSize: 12, fontWeight: 'normal', fontFamily: 'NauticalFont' },
});
