import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

// --- 1. Parámetros Globales (Optimizados para Tablet) ---
const COMPASS_SIZE = 350; // Tamaño reducido de 450/550 a 350 para caber en tablet vertical
const CENTER = COMPASS_SIZE / 2;
const RADIUS = CENTER - 20;
const INNER_RADIUS = RADIUS - 25;

const FONT_SIZE = 16;
const COLOR_CIRCLE_BG = '#4d4d4dff';
const COLOR_BORDER = '#fff';
const COLOR_3 = '#dc1212ff'; // Rojo para puntos cardinales


// --- 2. Funciones Auxiliares ---

/**
 * Dibuja una marca (tick) en el círculo.
 */
const getTick = (angleDeg, length, innerRadius, outerRadius, center, color) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const x1 = center + innerRadius * Math.cos(angleRad);
    const y1 = center + innerRadius * Math.sin(angleRad);
    const x2 = center + outerRadius * Math.cos(angleRad);
    const y2 = center + outerRadius * Math.sin(angleRad);

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

/**
 * Calcula la posición de los números/letras de grados.
 */
const getDegreeTextPosition = (angleDeg) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    const textRadius = RADIUS - 50;
    return {
        x: CENTER + textRadius * Math.cos(angleRad),
        y: CENTER + textRadius * Math.sin(angleRad) + (FONT_SIZE / 3)
    };
};


/**
 * Componente principal del Indicador de Rumbo con rotación del dial.
 */
const HeadingGauge = ({ value, unit, color }) => {

    const headingDegrees = parseFloat(value);
    const formattedHeading = headingDegrees.toFixed(0);
    const fontFamily = 'NauticalFont';

    // Rotación: Inversa al rumbo (si rumbo es 90, gira -90).
    const rotationAngle = -headingDegrees;

    // Generación de Ticks
    const ticks = [];
    for (let i = 0; i < 360; i += 1) {
        if (i % 30 === 0) {
            ticks.push(getTick(i, 1, INNER_RADIUS - 2, RADIUS, CENTER, COLOR_3));
        } else if (i % 10 === 0) {
            ticks.push(getTick(i, 0.5, INNER_RADIUS + 5, RADIUS, CENTER, COLOR_BORDER));
        } else if (i % 5 === 0) {
            ticks.push(getTick(i, 0.3, INNER_RADIUS + 15, RADIUS, CENTER, COLOR_BORDER));
        } else {
            ticks.push(getTick(i, 0.1, INNER_RADIUS + 18, RADIUS, CENTER, COLOR_BORDER));
        }
    }

    // 3. Array de Marcas Cardinales y Numéricas
    const degreeMarks = [
        { deg: 0, label: 'N', isCardinal: true },
        { deg: 30, label: '30', isCardinal: false },
        { deg: 60, label: '60', isCardinal: false },
        { deg: 90, label: 'E', isCardinal: true },
        { deg: 120, label: '120', isCardinal: false },
        { deg: 150, label: '150', isCardinal: false },
        { deg: 180, label: 'S', isCardinal: true },
        { deg: 210, label: '210', isCardinal: false },
        { deg: 240, label: '240', isCardinal: false },
        { deg: 270, label: 'O', isCardinal: true },
        { deg: 300, label: '300', isCardinal: false },
        { deg: 330, label: '330', isCardinal: false },
    ];

    return (
        <View style={styles.outerContainer(COMPASS_SIZE)}>
            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`}>

                {/* GRUPO ROTATORIO (G) */}
                <G
                    rotation={rotationAngle}
                    origin={`${CENTER}, ${CENTER}`}
                >
                    {/* A. Fondo del Círculo Rotatorio */}
                    <Circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill={COLOR_CIRCLE_BG}
                        stroke={COLOR_BORDER}
                        strokeWidth="3"
                    />

                    {/* B. Dibujar las Marcas (Ticks) - ROTAN */}
                    {ticks}

                    {/* C. Marcas Numéricas y Cardinales con Anti-Rotación */}
                    {degreeMarks.map(({ deg, label, isCardinal }) => {
                        const pos = getDegreeTextPosition(deg);

                        return (
                            <SvgText
                                key={deg}
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                // Tamaño ligeramente mayor para los puntos cardinales
                                fontSize={FONT_SIZE - (isCardinal ? 0 : 2)}
                                // Rojo para cardinales, blanco para números
                                fill={isCardinal ? COLOR_3 : COLOR_BORDER}
                                fontFamily={fontFamily}

                                // Anti-rotación y origen para mantener la verticalidad
                                rotation={-rotationAngle}
                                origin={`${pos.x}, ${pos.y}`}
                            >
                                {label}
                            </SvgText>
                        );
                    })}
                </G>

                {/* Marcador Fijo del Rumbo (Pointer - NO ROTA) */}
                <Line
                    x1={CENTER}
                    y1={10}
                    x2={CENTER}
                    y2={25}
                    stroke={color}
                    strokeWidth="4"
                />

            </Svg>

            {/* Rumbo Digital Central (Fijo, superpuesto) */}
            <View style={styles.digitalDisplay}>
                <Text style={[styles.headingText, { fontFamily }]}>{formattedHeading}</Text>
                {unit && <Text style={[styles.unitText, { fontFamily }]}>{unit}</Text>}
            </View>
        </View>
    );
};

// ------------------------------------------------------------------
// ESTILOS AJUSTADOS (Compactos para Tablet Vertical)
// ------------------------------------------------------------------

const styles = StyleSheet.create({
    outerContainer: (size) => ({
        // Dimensiones de la tarjeta (350 + 10 x 350 + 40)
        width: size + 10,
        height: size + 40,
        backgroundColor: '#575656ff',
        padding: 5,

        // Margen superior reducido para subir el compás
        marginTop: 10,
        marginHorizontal: 5,
        marginBottom: 5,

        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
    }),

    digitalDisplay: {
        position: 'absolute',
        // Centro (175) - 30 = 145 (Alineación vertical para COMPASS_SIZE=350)
        top: CENTER - 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headingText: {
        // Fuente ligeramente reducida
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    unitText: {
        fontSize: 20,
        color: '#fff',
        marginTop: -10,
    },
});

export default HeadingGauge;