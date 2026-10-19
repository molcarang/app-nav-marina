# Lectura de instrumentos Signal K

El catálogo `paths.js` usa rutas relativas al contexto `vessels.self`.
`instrumentDeltas.js` transforma objetos y actualizaciones parciales a lecturas
internas; `navigationData.js` convierte unidades y prepara la presentación.

- GPS: `navigation.position`, objeto con latitude/longitude en grados.
- Profundidad: `environment.depth.belowTransducer`, metros bajo el transductor.
- Escora: `navigation.attitude`, propiedad roll en radianes.
- Corriente: `environment.current`, drift en m/s y setTrue en radianes.
- También se admiten deltas de propiedades como `navigation.attitude.roll`.
- Rumbo: `navigation.headingTrue`; alternativa magnética únicamente si existe
  `navigation.magneticVariation`. No se sustituye por COG.
- COG: `navigation.courseOverGroundTrue`.
- Viento: `environment.wind.speedTrue`, `speedApparent`, `directionTrue`,
  `angleApparent`, `angleTrueWater`. Velocidades m/s, ángulos radianes.
- Timón: `steering.rudderAngle`, radianes.
- Motor: suscripciones `propulsion.*.revolutions` (Hz multiplicados por 60) y
  `propulsion.*.state` (`started`, `stopped`, `unusable`). Para cada motor, un estado
  explícito tiene prioridad sobre sus RPM. Basta una unidad en marcha para activar
  el indicador amarillo bajo la conexión; parado o sin datos queda gris.
  Es un botón que abre el Panel de motor tanto activo como inactivo o desconectado.
  El popup contiene en la parte superior los cuatro avisos de temperatura,
  aceite, alternador y batería; muestra sus estados en vivo y no altera la consola.
  El estado explícito se conserva hasta otro mensaje o una desconexión; las RPM
  caducan como las otras lecturas. El indicador no distingue marcha avante de punto
  muerto y no envía órdenes al motor. ENGINE/SAIL usa este mismo estado agregado.
  El popup muestra el cuentarrevoluciones con `engineRpm`, el máximo de RPM válidas
  entre las unidades recibidas (`propulsion.*.revolutions` en Hz × 60). El máximo
  de escala y el inicio de la zona roja se guardan juntos desde Ajustes, con
  valores iniciales de 5000 y 4000 RPM. La escala acepta 1000–20000 RPM enteras
  y el inicio rojo entre 0 y el máximo. El tramo rojo sigue la escala hasta el
  máximo con un degradado de transparente a rojo intenso a lo largo del arco;
  si ambos valores coinciden no tiene extensión. Los ajustes antiguos
  reciben los valores iniciales y los valores corruptos se normalizan.
  La aguja se limita al extremo de escala; sin RPM recientes queda gris al inicio.
  No hay displays digitales en las cinco esferas. El tacómetro ya no muestra SOG;
  la consola principal sigue recibiendo y mostrando esa velocidad.
  No fija un régimen máximo seguro
  del motor ni añade una alarma por RPM; la zona roja es una marca visual.
- Temperatura del motor: `propulsion.*.coolantTemperature`, con respaldo a
  `propulsion.*.temperature` para la misma unidad. Convierte kelvin a Celsius y,
  con varios motores, muestra la mayor temperatura disponible tras aplicar esa
  prioridad por unidad. No usa `environment.water.temperature` (agua del mar).
  La esfera pequeña superior izquierda del popup indica 0–120 °C con aguja;
  fuera de escala limita la aguja. Sin datos, tras 30 s sin lecturas o al
  desconectar, mantiene la aguja gris en reposo al inicio de escala.
  Las cuatro escalas pequeñas y sus agujas recorren un arco superior de 144°,
  simétrico respecto al centro (72° a cada lado). El tacómetro recupera su
  recorrido original de 270°, con la zona roja y la aguja siguiendo esa escala.
  Se conservan los nombres, unidades y números de las escalas.
  La distribución reserva cuatro esquinas alrededor del tacómetro central.
- Alarma de temperatura del motor: `notifications.propulsion.*.overTemperature`,
  `notifications.propulsion.*.coolantTemperature` y
  `notifications.propulsion.*.temperature`. El indicador del popup se activa
  en rojo para `alert`, `warn`, `alarm` o `emergency`; `normal`/`nominal` lo
  desactivan. Sin notificación válida o tras desconectar queda gris, sin datos.
  Las notificaciones se conservan hasta actualización, cancelación o desconexión.
  Basta una alarma activa entre motores. Es un aviso visual sin sonido, sin
  umbral local y sin relación con la temperatura del mar. `overTemperature`
  corresponde al aviso de sobretemperatura del motor recibido del convertidor
  NMEA 2000 de Signal K; no garantiza por sí solo qué sensor lo originó.
- Presión de aceite: `propulsion.*.oilPressure`, en Pa, convertidos a bar
  dividiendo por 100000. La esfera pequeña inferior izquierda indica 0–10 bar
  con aguja. Agrega la menor lectura válida si
  hay varios motores; cero es un dato válido. Sin datos o tras 30 s sin lecturas
  y al desconectar mantiene la aguja gris al inicio. Limita la aguja a la escala.
  El medidor no genera una alarma a partir de la presión.
- Alarma de presión de aceite: `notifications.propulsion.*.lowOilPressure` y
  `notifications.propulsion.*.oilPressure`. Mismos estados, conservación y
  cancelación que la alarma de temperatura. Indicador de aceitera en el popup,
  rojo si alguna unidad tiene una alarma activa, gris sin alarma o sin datos.
  No aplica un umbral local a la lectura de presión y no emite sonido.
- Alarma de carga del alternador: `notifications.propulsion.*.chargeIndicator`
  y `notifications.propulsion.*.alternatorVoltage`. Icono de alternador en el
  popup, con los mismos estados y conservación que las otras alarmas de motor.
  Rojo ante alarma recibida, gris sin alarma o sin datos, sin sonido. No calcula
  el fallo a partir de un voltaje fijo ni interpreta RPM como confirmación de carga.
- Batería baja: escucha las notificaciones explícitas
  `notifications.electrical.batteries.*.lowVoltage` y
  `notifications.electrical.batteries.*.lowStateOfCharge`. El servidor o su plugin
  debe publicarlas; la app no deduce un límite de voltaje o carga. Mismos estados
  y conservación que las otras alarmas, sin sonido. Basta una batería en alarma.
  No interpreta una alarma genérica de voltaje como batería baja, pues también
  podría indicar sobretensión. Icono de batería en el popup, tras el alternador.
- Nivel de combustible: `tanks.fuel.*.currentLevel`, ratio 0–1 convertido a
  porcentaje 0–100. Esfera superior derecha, con aguja.
  Rechaza valores fuera del ratio válido. Si recibe varios depósitos, muestra
  el menor nivel individual, sin calcular una reserva total ni promediar capacidades.
- Voltaje de batería: `electrical.batteries.*.voltage`, en V, esfera inferior
  derecha con escala inicial 0–16 V y aguja. Si llegan
  varias baterías muestra la menor lectura válida. No sustituye voltaje de batería
  por voltaje del alternador. La aguja se limita a la escala. Ambos medidores
  conservan cero como dato válido y dejan la aguja gris al inicio al faltar datos,
  caducar a los 30 s o desconectar. Las cinco agujas permanecen visibles;
  una lectura válida, incluso cero, se representa con aguja roja.
  No generan por sí solos avisos sonoros ni alarmas.
- Piloto: `steering.autopilot.state`; un estado ausente/desconocido no es standby.

Las conexiones de instrumentos, AIS y waypoint se reintentan cada cinco segundos tras una desconexión o un intento fallido. Al desconectarse se limpian las
lecturas; tras treinta segundos sin actualizaciones una lectura caduca. Este
plazo se basa en recepción y no garantiza que el reloj del sensor esté sincronizado.

El indicador de conexión representa el enlace con Signal K, no la conexión a
Internet. Se comprueba el propio WebSocket al abrirlo y cada 5 s mediante una
consulta de lectura `query: true` con un UUID nuevo. Signal K devuelve el estado
de esa petición; el 404 esperado para un UUID desconocido confirma el viaje de
ida y vuelta por el mismo enlace. No se envían escrituras ni órdenes al barco.
Sin respuesta en 3 s, error, cierre o rechazo de permisos se invalida la conexión,
aunque la página HTTP del servidor siga accesible. El evento `offline` adelanta
la comprobación. Recibir datos no cancela una comprobación pendiente sin respuesta.
Un servidor sin sensores activos permanece conectado si responde a estas consultas;
la caducidad de lecturas es independiente.
Un intento de conexión que no abre el socket caduca a los 8 s. En ambos casos se
invalidan los eventos del socket anterior y se reintenta a los 5 s.

Consulta de peticiones: https://signalk.org/specification/1.7.0/doc/request_response.html

Los paths privados `simulation.gps.*`, `navigation.depthBelowTransducer`,
`navigation.current.*` y `vessels.self.navigation.attitude.roll` no se consumen.
El plugin `simulation/signalk-standard-demo` publica los instrumentos en formato
estándar y sustituye al simulador numérico antiguo y al puente GPS de pruebas.
Debe instalarse en el servidor; los ficheros antiguos se conservan como referencia.

AIS conserva su receptor independiente. El waypoint usa `useWaypointData.js` y
`waypointData.js`: suscribe courseRhumbline/courseGreatCircle por WebSocket y
normaliza destino, distancia, demora, VMG y XTE sin mezclar familias. El panel
horizontal muestra el destino real con prioridad sobre la demostración. Cancelar
(posición nula), desconectar o dejar de actualizar durante 30 s lo oculta.
La distancia/demora pueden calcularse por ortodrómica si faltan y existe GPS propio;
el tiempo solo se calcula con velocidad de acercamiento positiva. XTE no se inventa.
No se lee la ruta completa ni se envían órdenes a un piloto. La API v2 exclusiva
sin deltas v1 equivalentes no forma parte de esta implementación.

Referencia: https://signalk.org/specification/1.7.0/doc/vesselsBranch.html
