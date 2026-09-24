import { useTranslation } from '../../localization/LanguageProvider';
import { Pressable, StyleSheet, View } from 'react-native';
import { projectAisPosition } from './shared/aisProjection';

/** Botones nativos sobre el SVG: el cristal y el parpadeo no afectan a los toques. */
export default function AisTouchOverlay({ targets = {}, position, heading, center, radius, size,
    positionReceivedAt, connected, onSelect }) {
    const { t } = useTranslation();
    const now = Date.now();
    if (!connected || !Number.isFinite(positionReceivedAt) || now - positionReceivedAt >= 30000) return null;
    const margin = size * 0.11;
    const scale = size / (size + 2 * margin);
    return <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        {Object.entries(targets).map(([id, target]) => {
            if (!Number.isFinite(target.positionReceivedAt) || now - target.positionReceivedAt >= 300000) return null;
            const point = projectAisPosition(position, target['navigation.position'], heading, radius);
            if (!point) return null;
            return <Pressable key={id} accessibilityRole="button"
                accessibilityLabel={t('aisTarget', { name: target.name || target.mmsi || id, distance: point.distanceNm.toFixed(1) })}
                onPress={() => onSelect({ ...target, id, distanceNm: point.distanceNm })}
                style={{ position: 'absolute', width: 44, height: 44,
                    left: (center + point.x + margin) * scale - 22,
                    top: (center + point.y + margin) * scale - 22 }} />;
        })}
    </View>;
}
