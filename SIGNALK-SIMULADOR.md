# Paths y datos de ejemplo para app-nav-marina

Inventario obtenido de `services/signalk/config.js` y `features/console/model/navigationData.js` el 22/09/2026. Son ejemplos nuevos para reconstruir la simulación, no los valores originales perdidos.

## Configurar el simulador

El fichero `simulator.json` que acompaña a esta guía contiene las 11 entradas numéricas que recibe actualmente la app, en el formato de configuración de `@signalk/simulatorplugin` (ID `simulator`).

- En la configuración del plugin **Signal K delta simulator**, añade las entradas de `configuration.items`: `path`, `minValue`, `maxValue`, `dataPeriod` y `outputPeriod`.
- Para restaurar mediante fichero, con el servidor detenido, copia `simulator.json` a `<directorio-config-SignalK>/plugin-config-data/simulator.json` y arranca el servidor. En una instalación habitual, el directorio de configuración es `~/.signalk`. Conserva una copia del fichero anterior si existe.
- Los ejemplos emiten cada 0.5 segundos y varían con ciclos de 60 segundos. Para un valor fijo, usa el mismo número en mínimo y máximo.
- La app conecta a `ws://openplotter.local:3000/signalk/v1/stream` y se suscribe al contexto `vessels.self`.

Formato contrastado con el [código del simulador](https://raw.githubusercontent.com/SignalK/simulatorplugin/master/index.js). Ubicación de configuración documentada en la [API de plugins de Signal K](https://demo.signalk.org/documentation/_signalk/server-api/Plugin.html). No se ha probado contra tu servidor ni se conoce la versión instalada.

## Todos los paths suscritos

Introduce números con punto decimal. La app convierte radianes a grados, m/s a nudos y revoluciones/s a RPM.

| Path literal que espera la app | Unidad/tipo | Ejemplo fijo | Equivalencia | Mínimo | Máximo |
| --- | --- | --- | --- | --- | --- |
| `environment.wind.directionTrue` | rad | 1.570796 | 90° | 1.396263 | 1.745329 |
| `environment.wind.speedTrue` | m/s | 7.716667 | 15 kn | 5.144444 | 10.288889 |
| `navigation.speedOverGround` | m/s | 3.086667 | 6 kn | 2.057778 | 4.115556 |
| `navigation.headingTrue` | rad | 0.785398 | 45° | 0.698132 | 0.872665 |
| `navigation.depthBelowTransducer` | m | 12 | 12 m | 8 | 16 |
| `navigation.current.drift` | m/s | 0.514444 | 1 kn | 0.257222 | 0.771667 |
| `navigation.current.setTrue` | rad | 2.094395 | 120° | 1.919862 | 2.268928 |
| `steering.rudderAngle` | rad | 0.087266 | 5° | -0.174533 | 0.174533 |
| `propulsion.0.revolutions` | rev/s | 0 | Motor parado; 30 = 1800 RPM | 0 | 0 |
| `environment.wind.angleApparent` | rad | 0.523599 | 30° a estribor | 0.349066 | 0.698132 |
| `steering.autopilot.state` | string | `standby` | STBY | — | — |
| `vessels.self.navigation.attitude.roll` | rad | 0.174533 | 10° | -0.261799 | 0.261799 |

### Piloto automático

Este simulador calcula valores numéricos y no permite simular strings. Por eso `steering.autopilot.state` no aparece en `simulator.json`. Sin otra fuente, la app conserva su valor inicial `standby`.

Para probar otros estados, emite desde una fuente que permita deltas de texto uno de estos valores: `standby` (STBY), `auto` (AUTO), `wind` (WIND) o `route` (TRACK). Ejemplo de delta, **no de configuración del simulatorplugin**:

```json
{
  "context": "vessels.self",
  "updates": [{
    "values": [{ "path": "steering.autopilot.state", "value": "wind" }]
  }]
}
```

## Alternativas de corriente presentes en el código

| Path | Unidad | Ejemplo | Alternativa de |
| --- | --- | --- | --- |
| `performance.currentDrift` | m/s | 0.514444 | `navigation.current.drift` |
| `ocean.drift` | m/s | 0.514444 | `navigation.current.drift` |
| `performance.currentSetTrue` | rad | 2.094395 | `navigation.current.setTrue` |
| `ocean.set` | rad | 2.094395 | `navigation.current.setTrue` |

Estos cuatro paths no están suscritos ni aceptados por el hook actual. Además, los principales se inicializan a 0 y la selección con `??` no pasa a las alternativas cuando el valor es 0. Emitirlos no cambia la pantalla: usa los paths `navigation.current.*` de la tabla principal.

## Particularidades de esta versión

- Se reproducen literalmente los paths del código. La profundidad se lee de `navigation.depthBelowTransducer`; emitir solamente `environment.depth.belowTransducer` no actualiza este indicador.
- La escora se lee de `vessels.self.navigation.attitude.roll`, incluido ese prefijo dentro del path. El hook no descompone un objeto `navigation.attitude` con propiedad `roll`, ni acepta `navigation.attitude.roll`. El ejemplo conserva el path literal para esta app; no debe tomarse como modelo de rutas estándar.
- El indicador rotulado COG usa `navigation.headingTrue`, no `navigation.courseOverGroundTrue`.
- TWA, VMG/VMC, máximos de SOG/TWS y modo de navegación se calculan localmente; no requieren paths adicionales. `isConnected` es un estado local.
- La selección de modo ENGINE exige actualmente más de **666661 RPM** en el código. Un ejemplo realista de 1800 RPM (`30` rev/s) seguirá mostrando SAIL.

## Pruebas rápidas

- Alarma de profundidad: fija mínimo y máximo de `navigation.depthBelowTransducer` en `2.5`.
- Viento por babor: fija `environment.wind.angleApparent` en `-0.523599` (−30°).
- Timón a 40°: fija `steering.rudderAngle` en `0.698132`, por encima del límite inicial de 35°.
- Escora de −15°: fija `vessels.self.navigation.attitude.roll` en `-0.261799`.

Reinicia la simulación tras guardar los cambios y comprueba en la app la conexión y los indicadores correspondientes.
