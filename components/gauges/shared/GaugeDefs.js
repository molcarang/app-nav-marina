// GaugeDefs.js
// Contiene los gradientes y Defs SVG comunes para HeadingGauge y SOGGauge
import { LinearGradient, RadialGradient, Stop } from 'react-native-svg';

export const GaugeDefs = () => (
    <>
        {/* Gradientes de bisel y anillo rojo */}
        <LinearGradient id="bezelOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#efefef" />
            <Stop offset="50%" stopColor="#888" />
            <Stop offset="100%" stopColor="#444" />
        </LinearGradient>
        <LinearGradient id="bezelInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#222" />
            <Stop offset="50%" stopColor="#444" />
            <Stop offset="100%" stopColor="#111" />
        </LinearGradient>
        <LinearGradient id="bezelRidge" x1="100%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#666" stopOpacity="0" />
        </LinearGradient>
        {/* Anillo rojo mecanizado */}
        <LinearGradient id="redMetalOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ff4d4d" />
            <Stop offset="100%" stopColor="#800000" />
        </LinearGradient>
        <LinearGradient id="redMetalInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#660000" />
            <Stop offset="100%" stopColor="#330000" />
        </LinearGradient>
        <LinearGradient id="redMetalRidge" x1="100%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#ffcccc" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
        </LinearGradient>
        {/* Gradientes de aguja y hub */}
        <LinearGradient id="needleSideA" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ff4d4d" />
            <Stop offset="100%" stopColor="#b30000" />
        </LinearGradient>
        <LinearGradient id="needleSideB" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#990000" />
            <Stop offset="100%" stopColor="#660000" />
        </LinearGradient>
        <LinearGradient id="hub3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#888" />
            <Stop offset="100%" stopColor="#222" />
        </LinearGradient>
        {/* Otros gradientes útiles */}
        <LinearGradient id="needleCompass" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#ff4444" />
            <Stop offset="50%" stopColor="#ff0000" />
            <Stop offset="50.1%" stopColor="#cc0000" />
            <Stop offset="100%" stopColor="#990000" />
        </LinearGradient>
        <LinearGradient id="needleRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#ff4444" />
            <Stop offset="50%" stopColor="#ff0000" />
            <Stop offset="100%" stopColor="#990000" />
        </LinearGradient>
        <LinearGradient id="needleBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#42a5f5" />
            <Stop offset="50%" stopColor="#2196f3" />
            <Stop offset="100%" stopColor="#0d47a1" />
        </LinearGradient>
        <LinearGradient id="needleOrange" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#ffb74d" />
            <Stop offset="50%" stopColor="#ff9800" />
            <Stop offset="100%" stopColor="#e65100" />
        </LinearGradient>
        {/* Reflejo y flare */}
        <LinearGradient id="glassReflection" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <Stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
        <RadialGradient id="flareGradient" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
    </>
);
