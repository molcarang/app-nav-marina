# Simulación estándar de instrumentos

Este plugin sustituye al simulador numérico de instrumentos y al puente GPS.
El plugin `signalk-ais-demo` se mantiene independiente y puede seguir activo.
No necesita otros plugins de cálculo ni el simulador antiguo.

## Instalar en OpenPlotter

1. Copia `signalk-standard-demo.zip` y extráelo en tu carpeta personal.
   Comprueba que existe `~/signalk-standard-demo/package.json`.
2. En una terminal de OpenPlotter, con el usuario que ejecuta Signal K:

   ```sh
   cd ~/.signalk
   npm install "$HOME/signalk-standard-demo"
   ```

   Si Signal K utiliza otra carpeta de configuración, ajusta `~/.signalk`.
3. En Plugin Config desactiva el plugin numérico **simulator** y, si lo instalaste,
   **GPS Demo - posicion para OpenCPN**. Guarda y reinicia Signal K.
4. Activa **Standard Demo - instrumentos Signal K** y guarda.
5. Mantén **AIS Demo - cuatro barcos simulados** activo si quieres probar AIS.
6. Recarga la app para descartar lecturas anteriores.

## Comprobar

En Data Browser, contexto del barco propio, busca:

| Path | Ejemplo / unidad |
|---|---|
| navigation.position | objeto latitude/longitude en grados |
| navigation.attitude | objeto roll/pitch/yaw en radianes |
| environment.current | objeto drift (m/s), setTrue (rad) |
| environment.depth.belowTransducer | 8–16 m |
| navigation.courseOverGroundTrue | rumbo de proa + 8°, en radianes |
| navigation.headingTrue | rumbo de proa en radianes |
| navigation.speedOverGround | velocidad en m/s |
| environment.wind.speedTrue / speedApparent | m/s |
| environment.wind.directionTrue / angleApparent | radianes |
| steering.rudderAngle | radianes |
| propulsion.0.revolutions | Hz = RPM / 60 |
| steering.autopilot.state | standby, auto, wind o route |

Todos los datos se publican cada segundo con fuente `signalk-standard-demo`.
La posición está situada junto a los cuatro AIS de prueba en Canarias.
Es un banco de pruebas visual: posición fija, velocidades y ángulos sintéticos.
No pretende reproducir la física de una travesía. No crea ni activa waypoints.

Abre también:
`http://openplotter.local:3000/signalk/v1/api/vessels/self/navigation/position`

Debe aparecer un objeto `value` con las coordenadas. OpenCPN puede leerlo a través
de su conexión Signal K existente. Selecciona Navegar hacia y cierra Opciones
para continuar la prueba de salida RMB/APB hacia Signal K.

## Pruebas configurables

- Profundidad: mínimo 1 y máximo 5 para cruzar una alarma configurada a 3 m.
- Motor: 0 RPM para SAIL; 1800 RPM para ENGINE.
- Piloto: cambia el estado en la configuración del plugin; no controla un piloto real.
- GPS: cambia latitud/longitud juntas; los contactos AIS conservan sus posiciones.

Desactiva los plugins de simulación antes de pasar a los sensores del barco.
Si hay fuentes duplicadas, comprueba las prioridades de fuentes en Signal K.

## Desarrollo

`fields.json` se genera desde el catálogo de la app con:
`node scripts/generate-standard-simulator.mjs` (desde la raíz del proyecto).
Los valores numéricos usan las unidades de Signal K.

Referencia: https://signalk.org/specification/1.7.0/doc/vesselsBranch.html
