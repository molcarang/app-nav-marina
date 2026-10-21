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

**Alarma de batería baja (tensión baja del sistema)**: interruptor desactivado
por defecto. Publica `notifications.propulsion.0.lowSystemVoltage` cada segundo:
`state: "alarm"` al activarlo y `state: "normal"` al desactivarlo. Corresponde al
aviso de baja tensión del PGN 127489, Discrete Status 1, bit 5. La app enciende
en rojo el icono y marco de batería; no indica un porcentaje de carga ni identifica
una batería concreta. No depende del voltaje configurado ni del testigo del alternador.
Solo aviso visual, sin sonido. El PGN 127508 entrega el voltaje, no esta alarma.

Ruta publicada por el conversor oficial:
https://github.com/SignalK/n2k-signalk/blob/master/pgns/127489.ts

**Alarma de temperatura alta del refrigerante del motor** y **Alarma de presión
de aceite baja del motor**: dos interruptores independientes, apagados por defecto.
Publican cada segundo las notificaciones reales de Signal K:

| Interruptor | Path | Origen NMEA 2000 |
|---|---|---|
| Temperatura alta | `notifications.propulsion.0.overTemperature` | PGN 127489, Discrete Status 1, bit 1 |
| Presión de aceite baja | `notifications.propulsion.0.lowOilPressure` | PGN 127489, Discrete Status 1, bit 2 |

Activado envía `state: "alarm"` y desactivado `state: "normal"`. El icono y marco
correspondientes del panel de alarmas pasan de gris a rojo y vuelven a gris.
Se pueden activar ambas a la vez. No cambian las lecturas de los relojes ni
dependen de ellas o de las RPM: simulan las señales discretas del motor.
Solo solicitan aviso visual, sin sonido. Actualiza los archivos del plugin y
reinicia Signal K para ver los nuevos interruptores en Plugin Config.

Estas rutas corresponden al conversor de Signal K:
https://github.com/SignalK/n2k-signalk/blob/master/pgns/127489.ts

**Testigo del alternador encendido (alarma de carga)**: interruptor desactivado
por defecto. Activado publica `state: "alarm"` y desactivado `state: "normal"`
en `notifications.propulsion.0.chargeIndicator` cada segundo. El icono y el marco
del alternador en la app pasan de gris a amarillo y vuelven a gris al desactivarlo.
Equivale al bit 9 de Discrete Status 1 del PGN 127489 (máscara 512 / 0x0200).
El plugin simula directamente su traducción a Signal K; no emite tramas NMEA 2000.
Es independiente de RPM y voltaje para poder probar contacto sin arrancar o una
alarma durante la marcha. Solo solicita aviso visual, sin sonido.

**Nivel de combustible (%)**: 0–100 %, por defecto 75 %. Publica
`tanks.fuel.0.currentLevel` como ratio 0–1 (0.75 para 75 %), correspondiente al
PGN 127505 (Fluid Level, tipo Fuel). Prueba 15 % para activar el aviso amarillo
de combustible bajo con el umbral predeterminado de la app (20 %).

**Voltaje de batería (V)**: 0–32 V, por defecto 13.8 V. Publica
`electrical.batteries.0.voltage`, correspondiente al PGN 127508 (Battery Status).
Prueba 12.4 o 14.2 V para mover el reloj. Su escala actual es de 0–16 V;
valores mayores se reciben, pero la aguja queda en el máximo. No genera una
notificación de batería baja a partir del voltaje.

Ambas lecturas se publican cada segundo. La app se suscribe a cualquier instancia
de depósito o batería mediante `tanks.fuel.*.currentLevel` y
`electrical.batteries.*.voltage`.

Conversores oficiales:
https://github.com/SignalK/n2k-signalk/blob/master/pgns/127505.ts
https://github.com/SignalK/n2k-signalk/blob/master/pgns/127508.js

La opción **Presión de aceite del motor (bar)** permite fijar entre 0 y 10 bar,
por defecto 4 bar. Publica `propulsion.0.oilPressure` cada segundo en pascales
(400000 Pa para 4 bar), igual que la conversión del PGN 127489 (Engine Parameters,
Dynamic). El reloj de aceite de la app se suscribe a `propulsion.*.oilPressure`
y convierte Pa a bar. Prueba 0, 1.5 o 4 bar para mover la aguja; no genera por sí
solo una notificación de alarma de aceite.

Referencia del conversor: https://github.com/SignalK/n2k-signalk/blob/master/pgns/127489.ts

La opción **Temperatura del refrigerante del motor (°C)** publica
`propulsion.0.temperature` cada segundo, como la conversión del PGN 127489.
Por defecto son 85 °C (358.15 K). Cambia, por ejemplo, a 60 o 95 °C y guarda
para comprobar que el reloj de temperatura del popup de motor sigue la lectura.
Es independiente de la temperatura del agua del mar y no genera una alarma.

La opción **Temperatura del agua (°C)** permite fijar una temperatura, por defecto
22 °C. El plugin publica `environment.water.temperature` cada segundo en kelvin
(295.15 K para 22 °C). La app la muestra debajo de LAT/LON en horizontal y bajo los indicadores en vertical.
Si ya tenías instalado el plugin, actualiza sus archivos y reinicia Signal K
para que aparezca la nueva opción. Conserva tu configuración local de viento
si la adaptaste para Derived Data; el ZIP del repositorio incluye el escenario
completo original de viento simulado.

En Data Browser, contexto del barco propio, busca:

| Path | Ejemplo / unidad |
|---|---|
| navigation.position | objeto latitude/longitude en grados |
| navigation.attitude | objeto roll/pitch/yaw en radianes |
| environment.current | objeto drift (m/s), setTrue (rad) |
| environment.depth.belowTransducer | 8–16 m |
| environment.water.temperature | 295.15 K = 22 °C por defecto |
| navigation.courseOverGroundTrue | rumbo de proa + 8°, en radianes |
| navigation.headingTrue | rumbo de proa en radianes |
| navigation.speedOverGround | velocidad en m/s |
| environment.wind.speedTrue / speedApparent | m/s |
| environment.wind.directionTrue / angleApparent | radianes |
| steering.rudderAngle | radianes |
| propulsion.0.revolutions | Hz = RPM / 60 |
| propulsion.0.temperature | 358.15 K = 85 °C por defecto |
| propulsion.0.oilPressure | 400000 Pa = 4 bar por defecto |
| tanks.fuel.0.currentLevel | 0.75 = 75 % por defecto |
| electrical.batteries.0.voltage | 13.8 V por defecto |
| notifications.propulsion.0.chargeIndicator | objeto de notificación, normal o alarm |
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
