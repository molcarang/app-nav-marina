import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

// --- Parámetros de configuración del compás ---
const COMPASS_SIZE = 560;
const CENTER = COMPASS_SIZE / 2; // 280
const RADIUS = CENTER - 20; // 260
const INNER_RADIUS = RADIUS - 55; // 205

const FONT_SIZE = 18;
const FONT_SIZE_NUMERIC = FONT_SIZE;
const FONT_SIZE_CARDINAL_LETTER = FONT_SIZE + 10; // Tamaño de letra para cardinales
const COLOR_CIRCLE_BG = 'rgba(40, 40, 40, 0.75)'; // Fondo del compás
const COLOR_BORDER = '#fff'; // Color de bordes y marcas
const COLOR_3 = '#dc1212ff'; // Rojo para heading/COG
const COLOR_INNER_DECO = 'rgba(40, 40, 40, 0.75)'; // Fondo interior
const COLOR_TWA_EXTERIOR = '#ff9800'; // Naranja para TWA

// Radios para la posición del texto:
const TEXT_RADIUS_OUTER_DIAL = RADIUS - 60;
const TEXT_RADIUS_INNERMOST_CARDINAL = 140;

const TWA_EXTERIOR_DISTANCE = RADIUS + 10;
const TWA_TRIANGLE_HEIGHT = 25;

// Parámetros para los arcos de referencia de TWA
const ARC_RADIUS = RADIUS + 15;
const ARC_THICKNESS = 15;
const ARC_COLOR_GREEN = '#00ff00'; // Verde
const ARC_COLOR_RED = '#ff0000';   // Rojo


// --- Funciones auxiliares para dibujo y geometría ---

const getTick = (angleDeg, length, innerRadius, outerRadius, center, color) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const x1 = center + innerRadius * Math.cos(angleRad);
    const y1 = center + innerRadius * Math.sin(angleRad);
    const x2 = center + outerRadius * Math.cos(angleRad);
    const y2 = center + outerRadius * Math.sin(angleRad);

    // Dibuja una marca (tick) en el ángulo especificado
    return (
        <Line
            key={angleDeg}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke={color}
            strokeWidth={length > 0.8 ? 2 : 1}
        />
    );
};

// Calcula la posición (x, y) para un texto dado un ángulo y radio
const getDegreeTextPosition = (angleDeg, radius, offset = 0) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
        x: CENTER + (radius + offset) * Math.cos(angleRad),
        y: CENTER + (radius + offset) * Math.sin(angleRad) + (FONT_SIZE_NUMERIC / 3)
    };
};

// Convierte coordenadas polares a cartesianas para SVG
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180.0);
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// Genera el path SVG para un arco entre dos ángulos dados
const getArcPath = (startAngle, endAngle, radius) => {
    const start = polarToCartesian(CENTER, CENTER, radius, endAngle);
    const end = polarToCartesian(CENTER, CENTER, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 && endAngle - startAngle > 0 ? "0" : "1";
    const d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
    return d;
}


const HeadingGauge = ({ value, unit, headingColor, twd, twaCog }) => {

    const headingDegrees = parseFloat(value);
    const formattedHeading = isNaN(headingDegrees) ? '---' : headingDegrees.toFixed(0);
    const fontFamily = 'NauticalFont';

    const rotationAngle = isNaN(headingDegrees) ? 0 : -headingDegrees;

    const finalHeadingColor = headingColor || COLOR_3;

    // Generación de Ticks y Datos de Marcas...
    const ticks = [];
    for (let i = 0; i < 360; i += 1) {
        if (i % 30 === 0) {
            ticks.push(getTick(i, 1, INNER_RADIUS + 15, RADIUS, CENTER, COLOR_3));
        } else if (i % 10 === 0) {
            ticks.push(getTick(i, 0.5, INNER_RADIUS + 15, RADIUS, CENTER, COLOR_BORDER));
        } else if (i % 5 === 0) {
            ticks.push(getTick(i, 0.3, INNER_RADIUS + 25, RADIUS, CENTER, COLOR_BORDER));
        } else {
            ticks.push(getTick(i, 0.1, INNER_RADIUS + 35, RADIUS, CENTER, COLOR_BORDER));
        }
    }

    // Datos de Marcas
    const numericalMarks = [
        { deg: 30, label: '30', color: COLOR_BORDER }, { deg: 60, label: '60', color: COLOR_BORDER },
        { deg: 120, label: '120', color: COLOR_BORDER }, { deg: 150, label: '150', color: COLOR_BORDER },
        { deg: 210, label: '210', color: COLOR_BORDER }, { deg: 240, label: '240', color: COLOR_BORDER },
        { deg: 300, label: '300', color: COLOR_BORDER }, { deg: 330, label: '330', color: COLOR_BORDER },
    ];

    const cardinalMarks = [
        { deg: 0, label: 'N', num: '0', color: COLOR_3 }, { deg: 90, label: 'E', num: '90', color: COLOR_3 },
        { deg: 180, label: 'S', num: '180', color: COLOR_3 }, { deg: 270, label: 'O', num: '270', color: COLOR_3 },
    ];


    return (
        <View style={styles.outerContainer(COMPASS_SIZE)}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>

                {/* *** 1. CAPAS INFERIORES Y DIAL ROTATORIO *** */}
                <G
                    rotation={rotationAngle}
                    origin={`${CENTER}, ${CENTER}`}
                >
                    {/* A. Fondo del Círculo Principal */}
                    <Circle
                        cx={CENTER} cy={CENTER} r={RADIUS}
                        fill={COLOR_CIRCLE_BG} stroke={COLOR_BORDER} strokeWidth="5"
                    />

                    {/* B. Círculo Decorativo Interior (el más pequeño) */}
                    <Circle
                        cx={CENTER} cy={CENTER} r={INNER_RADIUS - 35}
                        fill={COLOR_INNER_DECO} stroke={COLOR_BORDER} strokeWidth="1"
                    />

                    {/* C. Dibujar las Marcas (Ticks) - ROTAN */}
                    {ticks}

                    {/* D. GRADOS NUMÉRICOS (0, 30, 60, 90, etc.) - ANILLO EXTERIOR DEL DIAL */}
                    {[...numericalMarks, ...cardinalMarks.map(c => ({ deg: c.deg, label: c.num, color: c.color }))].map(({ deg, label, color }) => {
                        const pos = getDegreeTextPosition(deg, TEXT_RADIUS_OUTER_DIAL);
                        const textRotation = -rotationAngle;

                        return (
                            <SvgText
                                key={deg + 'num_dial'} x={pos.x} y={pos.y} textAnchor="middle"
                                fontSize={FONT_SIZE_NUMERIC}
                                fill={color}
                                fontFamily={fontFamily}
                                rotation={textRotation} origin={`${pos.x}, ${pos.y}`}
                            >
                                {label}
                            </SvgText>
                        );
                    })}

                    {/* E. LETRAS CARDINALES (N, E, S, O) - EN EL CÍRCULO INTERIOR ROTANDO */}
                    {cardinalMarks.map(({ deg, label, color }) => {
                        const pos = getDegreeTextPosition(deg, TEXT_RADIUS_INNERMOST_CARDINAL);
                        const textRotation = -rotationAngle;

                        let yOffset = (FONT_SIZE_CARDINAL_LETTER / 2) - (FONT_SIZE_NUMERIC / 2) - 3;

                        return (
                            <SvgText
                                key={deg + 'let_inner'} x={pos.x} y={pos.y + yOffset} textAnchor="middle"
                                fontSize={FONT_SIZE_CARDINAL_LETTER}
                                fill={color}
                                fontFamily={fontFamily}
                                rotation={textRotation} origin={`${pos.x}, ${pos.y + yOffset}`}
                            >
                                {label}
                            </SvgText>
                        );
                    })}
                </G>

                {/* *** 2. CAPAS SUPERIORES (Indicadores y Marcadores FIJOS) *** */}

                {/* 1. ARCO VERDE FIJO (20° a 60°) */}
                <Path
                    d={getArcPath(20, 60, ARC_RADIUS)}
                    stroke={ARC_COLOR_GREEN}
                    strokeWidth={ARC_THICKNESS}
                    fill="none"
                />

                {/* 🚨 2. ARCO ROJO FIJO (300° a 340°) */}
                <Path
                    d={getArcPath(300, 340, ARC_RADIUS)}
                    stroke={ARC_COLOR_RED}
                    strokeWidth={ARC_THICKNESS}
                    fill="none"
                />

                {/* LÍNEA DE CRUJÍA/COG (Roja) - Fija y visible */}
                <Line
                    x1={CENTER} y1={CENTER}
                    x2={CENTER} y2={25}
                    stroke={COLOR_3}
                    strokeWidth="2"
                />



                {/* TWA_COG (True Wind Angle Relativo a COG) - Indicador Naranja y Línea */}
                {typeof twaCog === 'number' && (
                    <G rotation={twaCog} origin={`${CENTER}, ${CENTER}`}>
                        {/* Línea que une el centro con la punta del triángulo */}
                        <Line
                            x1={CENTER} y1={CENTER}
                            x2={CENTER} y2={CENTER - TWA_EXTERIOR_DISTANCE}
                            stroke={COLOR_TWA_EXTERIOR}
                            strokeWidth="2"
                            strokeDasharray="5, 5"
                        />

                        {/* Triángulo Naranja que apunta hacia el centro */}
                        <Polygon
                            points={`${CENTER - 20}, 5 ${CENTER + 20}, 5 ${CENTER}, 45`}
                            fill={COLOR_TWA_EXTERIOR}
                            stroke={COLOR_BORDER}
                            strokeWidth="2"
                        />
                    </G>
                )}


                {twd !== undefined && (
                    <G rotation={twd} origin={`${CENTER}, ${CENTER}`}>
                        {/* Línea que une el centro con la punta del triángulo */}
                        <Line
                            x1={CENTER} y1={CENTER}
                            x2={CENTER} y2={CENTER - TWA_EXTERIOR_DISTANCE}
                            stroke="#2196f3"
                            strokeWidth="2"
                            strokeDasharray="5, 5"
                        />

                        {/* Triángulo Naranja que apunta hacia el centro */}
                        <Polygon
                            points={`${CENTER - 20}, 5 ${CENTER + 20}, 5 ${CENTER}, 40`}
                            fill="#2196f3"
                            stroke={COLOR_BORDER}
                            strokeWidth="2"
                        />
                    </G>
                )}



                {/* MARCADOR DE COG/PROA: Triángulo Fijo (Referencia de 0 grados) */}
                <Polygon
                    /* De -10 a -20 (izquierda), de +10 a +20 (derecha) y de 25 a 45 (punta hacia abajo) */
                    points={`${CENTER - 20}, 5 ${CENTER + 20}, 5 ${CENTER}, 45`}
                    fill={finalHeadingColor}
                    stroke={COLOR_BORDER}
                    strokeWidth="2"
                />

            </Svg>

            {/* Rumbo Digital Central (Fijo, superpuesto) */}
            <View style={styles.digitalDisplay}>
                <Text style={[styles.headingText, { fontFamily, color: finalHeadingColor }]}>{formattedHeading}</Text>
                {unit && <Text style={[styles.unitText, { fontFamily }]}>{unit}</Text>}
            </View>
        </View>
    );
};

// ------------------------------------------------------------------
// ESTILOS (Sin Cambios)
// ------------------------------------------------------------------

const styles = StyleSheet.create({
    outerContainer: (size) => ({
        width: size + 10,
        height: size + 40,
        padding: 5,
        marginTop: 10,
        marginHorizontal: 5,
        marginBottom: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
    }),

    digitalDisplay: {
        position: 'absolute',
        top: CENTER - 25,
        alignItems: 'center',
        justifyContent: 'center',
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