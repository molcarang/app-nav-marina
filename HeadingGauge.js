import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

// --- 1. Parámetros Globales ---
const COMPASS_SIZE = 560;
const CENTER = COMPASS_SIZE / 2;
const RADIUS = CENTER - 20;
const INNER_RADIUS = RADIUS - 55;

const FONT_SIZE_NUMERIC = 18;
const FONT_SIZE_CARDINAL_LETTER = 28;

const COLOR_CIRCLE_BG = 'rgba(40, 40, 40, 0.75)';
const COLOR_BORDER = '#fff';
const COLOR_RED = '#dc1212ff';
const COLOR_TWA = '#ff9800';
const COLOR_TWD = '#2196f3';

const TEXT_RADIUS_OUTER = RADIUS - 60;
const TEXT_RADIUS_CARDINAL = 140;
const WIND_INDICATOR_DISTANCE = RADIUS + 10;

// --- 2. Funciones Geométricas Auxiliares ---

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
};

const getTick = (angleDeg, innerR, outerR, color, isBold) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return (
        <Line
            key={`tick-${angleDeg}`}
            x1={CENTER + innerR * Math.cos(angleRad)}
            y1={CENTER + innerR * Math.sin(angleRad)}
            x2={CENTER + outerR * Math.cos(angleRad)}
            y2={CENTER + outerR * Math.sin(angleRad)}
            stroke={color}
            strokeWidth={isBold ? 2 : 1}
        />
    );
};

// --- 3. Componente Principal ---

const HeadingGauge = ({ 
    value, 
    minLayline = 20, 
    maxLayline = 60, 
    rotationAngle, 
    unit, 
    headingColor, 
    twd, 
    twaCog, 
    isNightMode, 
    set 
}) => {
    const RADIUS_ARCS = RADIUS + 15;
    const setAngle = parseFloat(set) || 0;
    const formattedHeading = isNaN(parseFloat(value)) ? '---' : parseFloat(value).toFixed(0);
    const finalHeadingColor = headingColor || COLOR_RED;
    const fontFamily = 'NauticalFont';

    // Listas de marcas del dial
    const numericalMarks = [30, 60, 120, 150, 210, 240, 300, 330];
    const cardinalMarks = [
        { deg: 0, label: 'N', val: '0' }, { deg: 90, label: 'E', val: '90' },
        { deg: 180, label: 'S', val: '180' }, { deg: 270, label: 'O', val: '270' }
    ];

    return (
        <View style={styles.outerContainer}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>
                
                {/* 1. DIAL ROTATORIO */}
                <G rotation={rotationAngle} origin={`${CENTER}, ${CENTER}`}>
                    <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={COLOR_CIRCLE_BG} stroke={COLOR_BORDER} strokeWidth="5" />
                    <Circle cx={CENTER} cy={CENTER} r={INNER_RADIUS - 35} fill={COLOR_CIRCLE_BG} stroke={COLOR_BORDER} strokeWidth="1" />
                    
                    {/* Dibujar Ticks */}
                    {Array.from({ length: 360 }).map((_, i) => {
                        if (i % 30 === 0) return getTick(i, INNER_RADIUS + 15, RADIUS, COLOR_RED, true);
                        if (i % 10 === 0) return getTick(i, INNER_RADIUS + 15, RADIUS, COLOR_BORDER, false);
                        if (i % 5 === 0)  return getTick(i, INNER_RADIUS + 25, RADIUS, COLOR_BORDER, false);
                        return getTick(i, INNER_RADIUS + 35, RADIUS, COLOR_BORDER, false);
                    })}

                    {/* Grados Numéricos */}
                    {[...numericalMarks, ...cardinalMarks.map(m => parseInt(m.val))].map(deg => {
                        const pos = polarToCartesian(CENTER, CENTER, TEXT_RADIUS_OUTER, deg);
                        return (
                            <SvgText
                                key={`num-${deg}`} x={pos.x} y={pos.y + (FONT_SIZE_NUMERIC/3)} textAnchor="middle"
                                fontSize={FONT_SIZE_NUMERIC} fill={deg % 90 === 0 ? COLOR_RED : COLOR_BORDER}
                                fontFamily={fontFamily} rotation={-rotationAngle} origin={`${pos.x}, ${pos.y}`}
                            >
                                {deg}
                            </SvgText>
                        );
                    })}

                    {/* Letras Cardinales */}
                    {cardinalMarks.map(({ deg, label }) => {
                        const pos = polarToCartesian(CENTER, CENTER, TEXT_RADIUS_CARDINAL, deg);
                        const yOff = (FONT_SIZE_CARDINAL_LETTER / 2) - (FONT_SIZE_NUMERIC / 2) - 3;
                        return (
                            <SvgText
                                key={`card-${label}`} x={pos.x} y={pos.y + yOff} textAnchor="middle"
                                fontSize={FONT_SIZE_CARDINAL_LETTER} fill={COLOR_RED}
                                fontFamily={fontFamily} rotation={-rotationAngle} origin={`${pos.x}, ${pos.y + yOff}`}
                            >
                                {label}
                            </SvgText>
                        );
                    })}
                </G>

                {/* 2. INDICADOR DE CORRIENTE */}
                <G rotation={setAngle + rotationAngle} origin={`${CENTER}, ${CENTER}`}>
                    <Path
                        d={`M ${CENTER-25} ${CENTER+120} L ${CENTER+25} ${CENTER+120} L ${CENTER+25} ${CENTER-40} L ${CENTER+55} ${CENTER-40} L ${CENTER} ${CENTER-150} L ${CENTER-55} ${CENTER-40} L ${CENTER-25} ${CENTER-40} Z`}
                        fill="none" stroke="#00ffff" strokeWidth="4" opacity={0.2}
                    />
                </G>

                {/* 3. BARCO Y CRUJÍA */}
                <G opacity={isNightMode ? 0.25 : 0.15}>
                    <Path
                        d={`M ${CENTER} ${CENTER-165} C ${CENTER+50} ${CENTER-80}, ${CENTER+45} ${CENTER+100}, ${CENTER+40} ${CENTER+155} L ${CENTER-40} ${CENTER+155} C ${CENTER-45} ${CENTER+100}, ${CENTER-50} ${CENTER-80}, ${CENTER} ${CENTER-165} Z`}
                        fill="none" stroke={isNightMode ? "#f00" : "#fff"} strokeWidth="2.5"
                    />
                    <Line x1={CENTER} y1={CENTER-165} x2={CENTER} y2={CENTER+155} stroke={isNightMode ? "#f00" : "#fff"} strokeDasharray="4, 12" />
                </G>

                {/* 4. ARCOS DE CEÑIDA (Laylines) */}
                <Path d={describeArc(CENTER, CENTER, RADIUS_ARCS, minLayline, maxLayline)} fill="none" stroke="#00ff00" strokeWidth="15" strokeLinecap="round" opacity={0.5} />
                <Path d={describeArc(CENTER, CENTER, RADIUS_ARCS, 360-maxLayline, 360-minLayline)} fill="none" stroke="#ff0000" strokeWidth="15" strokeLinecap="round" opacity={0.5} />

                {/* 5. INDICADORES DE VIENTO Y RUMBO */}
                {typeof twaCog === 'number' && (
                    <G rotation={twaCog} origin={`${CENTER}, ${CENTER}`}>
                        <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER-WIND_INDICATOR_DISTANCE} stroke={COLOR_TWA} strokeWidth="2" strokeDasharray="5, 5" />
                        <Polygon points={`${CENTER-20},5 ${CENTER+20},5 ${CENTER},45`} fill={COLOR_TWA} stroke={COLOR_BORDER} strokeWidth="2" />
                    </G>
                )}
                
                {twd !== undefined && (
                    <G rotation={twd} origin={`${CENTER}, ${CENTER}`}>
                        <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER-WIND_INDICATOR_DISTANCE} stroke={COLOR_TWD} strokeWidth="2" strokeDasharray="5, 5" />
                        <Polygon points={`${CENTER-20},5 ${CENTER+20},5 ${CENTER},40`} fill={COLOR_TWD} stroke={COLOR_BORDER} strokeWidth="2" />
                    </G>
                )}

                <Line x1={CENTER} y1={CENTER} x2={CENTER} y2={25} stroke={COLOR_RED} strokeWidth="2" />
                <Polygon points={`${CENTER-20},5 ${CENTER+20},5 ${CENTER},45`} fill={finalHeadingColor} stroke={COLOR_BORDER} strokeWidth="2" />

            </Svg>

            {/* 6. DISPLAY DIGITAL */}
            <View style={styles.digitalDisplay}>
                <Text style={[styles.headingText, { color: finalHeadingColor }]}>{formattedHeading}</Text>
                {unit && <Text style={styles.unitText}>{unit}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        width: COMPASS_SIZE + 10,
        height: COMPASS_SIZE + 40,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    digitalDisplay: {
        position: 'absolute',
        top: CENTER - 25,
        alignItems: 'center',
    },
    headingText: {
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
    },
    unitText: {
        fontSize: 20,
        color: '#fff',
        marginTop: -10,
        fontFamily: 'NauticalFont',
    },
});

export default HeadingGauge;