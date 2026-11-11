import { useTranslation } from '../../localization/LanguageProvider';
import { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { Platform } from 'react-native';
import { projectAisPosition } from './shared/aisProjection';
import { AIS_RISK_COLORS } from '../../features/console/model/aisCollisionRisk';

export default function AisTargets({ targets = {}, position, heading, center, radius, size, positionReceivedAt,
    connected, rangeNm = 6, animationPhase = 0, onSelect, showLabels = false, showCourseVector = false }) {
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
            const showApproach = level === 'warning' || level === 'danger';
            const phase = (animationPhase * 2) % 1;
            const opacity = level === 'danger' && phase >= 0.5 ? 0.25 : 1;
            const course = Number.isFinite(target['navigation.headingTrue']) ? target['navigation.headingTrue'] : target['navigation.courseOverGroundTrue'];
            const relativeCourse = Number.isFinite(course) ? course * 180 / Math.PI - heading : null;
            const label = String(target.name || target.mmsi || id.replace(/^vessels\./, '')).slice(0, 18);
            const speed = target['navigation.speedOverGround'];
            const speedLabel = Number.isFinite(speed) ? `${(speed * 1.94384).toFixed(1)} kn` : '— kn';
            const courseLabel = Number.isFinite(course)
                ? `${Math.round(((course * 180 / Math.PI) % 360 + 360) % 360) % 360}° T` : '—°';
            const cpa = Number.isFinite(target.collision?.cpaNm) ? target.collision.cpaNm.toFixed(2) : '—';
            const tcpa = Number.isFinite(target.collision?.tcpaMinutes) && target.collision.tcpaMinutes >= 0
                ? target.collision.tcpaMinutes.toFixed(1) : '—';
            return <G key={id} opacity={opacity} transform={`translate(${center + point.x}, ${center + point.y})`}
                onPress={() => onSelect?.({ ...target, id, distanceNm: point.distanceNm })}
                // En web, accessibilityRole="button" sustituye el grupo SVG por HTML.
                accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
                accessibilityLabel={t('aisTarget', { name: target.name || target.mmsi || id, distance: point.distanceNm.toFixed(1) })}>
                <Circle r={Math.max(marker * 1.2, 22 * 1.22)} fill="transparent" />
                {showCourseVector && relativeCourse !== null && <G rotation={relativeCourse} origin="0, 0">
                    <Line x1={0} y1={-marker * 0.75} x2={0} y2={-marker * 4.2}
                        stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.9} />
                    <Circle cx={0} cy={-marker * 4.2} r={2.4} fill={color} />
                </G>}
                {Number.isFinite(course) ? <Polygon
                    points={`0,${-marker} ${marker * 0.7},${marker} 0,${marker * 0.5} ${-marker * 0.7},${marker}`}
                    rotation={relativeCourse} fill={color} stroke="#082c24" strokeWidth={1.2} />
                    : <Circle r={marker * 0.7} fill={color} stroke="#082c24" strokeWidth={1.2} />}
                {showLabels && <G>
                    <SvgText x={0} y={-marker - (showApproach ? 40 : 24)} textAnchor="middle" fill="#ffffff"
                        stroke="#071522" strokeWidth={3} paintOrder="stroke" fontSize={14}
                        fontFamily="NauticalFont">{label}</SvgText>
                    <SvgText x={0} y={-marker - (showApproach ? 24 : 8)} textAnchor="middle" fill="#8fcbdc"
                        stroke="#071522" strokeWidth={3} paintOrder="stroke" fontSize={11}
                        fontFamily="NauticalFont">{`${speedLabel} · ${courseLabel}`}</SvgText>
                    {showApproach && <SvgText x={0} y={-marker - 8} textAnchor="middle" fill={color}
                        stroke="#071522" strokeWidth={3} paintOrder="stroke" fontSize={11}
                        fontFamily="NauticalFont">{`CPA ${cpa} · TCPA ${tcpa}`}</SvgText>}
                </G>}
            </G>;
        })}
    </G>;
}
