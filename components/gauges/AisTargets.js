import { useTranslation } from '../../localization/LanguageProvider';
import { Circle, G, Polygon } from 'react-native-svg';
import { Platform } from 'react-native';
import { projectAisPosition } from './shared/aisProjection';
import { AIS_RISK_COLORS } from '../../features/console/model/aisCollisionRisk';

export default function AisTargets({ targets = {}, position, heading, center, radius, size, positionReceivedAt, connected, rangeNm = 6, animationPhase = 0, onSelect }) {
    const { t } = useTranslation();
    const now = Date.now();
    if (!connected || !Number.isFinite(positionReceivedAt) || now - positionReceivedAt >= 30000) return null;
    const marker = Math.max(4, size * 0.012) * 2.25;
    return <G>
        {Object.entries(targets).map(([id, target]) => {
            if (!Number.isFinite(target.positionReceivedAt) || now - target.positionReceivedAt >= 300000) return null;
            const point = projectAisPosition(position, target['navigation.position'], heading, radius, rangeNm);
            if (!point) return null;
            const level = target.collision?.level ?? 'unknown';
            const color = AIS_RISK_COLORS[level];
            const phase = (animationPhase * 2) % 1;
            const opacity = level === 'danger' && phase >= 0.5 ? 0.25 : 1;
            const course = Number.isFinite(target['navigation.headingTrue']) ? target['navigation.headingTrue'] : target['navigation.courseOverGroundTrue'];
            return <G key={id} opacity={opacity} transform={`translate(${center + point.x}, ${center + point.y})`}
                onPress={() => onSelect?.({ ...target, id, distanceNm: point.distanceNm })}
                // En web, accessibilityRole="button" sustituye el grupo SVG por HTML.
                accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
                accessibilityLabel={t('aisTarget', { name: target.name || target.mmsi || id, distance: point.distanceNm.toFixed(1) })}>
                <Circle r={Math.max(marker * 1.2, 22 * 1.22)} fill="transparent" />
                {Number.isFinite(course) ? <Polygon
                    points={`0,${-marker} ${marker * 0.7},${marker} 0,${marker * 0.5} ${-marker * 0.7},${marker}`}
                    rotation={course * 180 / Math.PI - heading} fill={color} stroke="#082c24" strokeWidth={1.2} />
                    : <Circle r={marker * 0.7} fill={color} stroke="#082c24" strokeWidth={1.2} />}
            </G>;
        })}
    </G>;
}
