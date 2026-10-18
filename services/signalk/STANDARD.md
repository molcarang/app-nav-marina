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
- Motor: suscripción `propulsion.*.revolutions`, Hz multiplicados por 60.
  El indicador agregado usa las RPM máximas recibidas: ENGINE si algún motor gira,
  SAIL si hay lecturas y todas son cero. No distingue propulsión de punto muerto.
- Piloto: `steering.autopilot.state`; un estado ausente/desconocido no es standby.

Las conexiones de instrumentos, AIS y waypoint se reintentan cada cinco segundos tras una desconexión o un intento fallido. Al desconectarse se limpian las
lecturas; tras treinta segundos sin actualizaciones una lectura caduca. Este
plazo se basa en recepción y no garantiza que el reloj del sensor esté sincronizado.

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
