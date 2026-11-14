# Tareas pendientes

Esta lista recoge las tareas del proyecto. Cuando el usuario diga «pon en TODO»,
añadir la tarea aquí sin implementarla salvo que también lo solicite.
Marcar con `[x]` las tareas completadas y conservarlas como referencia.

## Pendientes

### Navegación y rutas

- [ ] **Implementar un asistente de ruta.**
  Comparar el COG con la demora al waypoint o, cuando exista, con
  `bearingTrackTrue`. Mostrar diferencia angular, corrección a babor/estribor y
  estado «ACERCÁNDOSE»/«ALEJÁNDOSE». Integrarlo con XTE, distancia y TTD sin
  confundir rumbo de proa con trayectoria sobre el fondo.

- [ ] **Mostrar distancia recorrida y tiempo de navegación.**
  Registrar millas, duración total, tiempo a motor y a vela, SOG media/máxima y
  consumo estimado. Permitir reiniciar el viaje y conservar sesiones anteriores.

### Diagnóstico de Signal K

- [ ] **Crear una pantalla de diagnóstico de Signal K.**
  Mostrar por cada instrumento el path, valor original, unidad, fuente,
  timestamp, antigüedad y estado válido/caducado/ausente. Incluir las ramas de
  waypoint, AIS, motor y las fuentes duplicadas para facilitar la puesta en marcha.

- [ ] **Mostrar el estado de actualización de cada instrumento.**
  Distinguir visualmente una lectura reciente, una lectura caducada y la ausencia
  de datos aunque la conexión general con Signal K continúe activa.

### AIS

- [ ] **Ampliar el radar AIS detallado.**
  Añadir distancia y demora de cada contacto, estela histórica, vector de rumbo
  proporcional a la velocidad, selección persistente de un barco y filtros para
  ocultar contactos fondeados o muy lentos.

- [ ] **Representar gráficamente el encuentro CPA.**
  Dibujar las trayectorias relativas, el punto previsto de CPA y las posiciones
  propias y del objetivo en el momento del encuentro. Reutilizar la evaluación y
  los límites configurados, sin crear una segunda lógica de riesgo.

### Motor, energía y sensores

- [ ] **Mostrar la batería de servicio.**
  Incorporar tensión, porcentaje de carga, corriente, potencia y autonomía cuando
  Signal K publique esos datos. Mantenerla separada de la batería de arranque del
  motor y permitir una alarma configurable.

- [ ] **Añadir calibración de sensores.**
  Permitir offsets documentados para viento aparente, rumbo y profundidad, además
  de calibración del nivel de combustible. Mostrar siempre si la corrección se
  aplica en la app o en Signal K y evitar correcciones duplicadas.

### Registro y mantenimiento

- [ ] **Crear un libro de navegación automático.**
  Registrar salida/llegada, arranques y paradas del motor, waypoints alcanzados,
  alarmas AIS, máximos de escora/viento, millas, horas y combustible. Permitir
  consultar sesiones y exportarlas en CSV o PDF.

- [ ] **Ejecutar alarmas críticas también en Raspberry/Signal K.**
  Mantener las alarmas esenciales cuando la tablet pierda conexión, quede en
  segundo plano, se bloquee o se apague. Evitar sonidos duplicados y documentar
  qué equipo es responsable de cada alarma.

### Piloto automático

- [ ] **Corrección de grados del piloto automático.**
  Verificar referencia verdadera/magnética, unidades y normalización al cruzar
  0°/360° antes de recuperar cualquier control desde la aplicación.

- [ ] **Implementar el control AUTO/STANDBY del piloto NAC-3 desde la aplicación.**
  Trabajo aplazado; implementación retirada. Retomar compatibilidad y configuración
  de `signalk-autopilot`, autorización con token, confirmación del estado real y
  ausencia de reenvíos al reconectar. Actualizar la guía de instalación y validar
  a bordo antes de darlo por terminado.

### Plataformas y despliegue

- [ ] **Validar la versión de la aplicación para Raspberry Pi.**
  El paquete web y el instalador están preparados en `raspberry/` para Pi 5 y
  pantalla táctil 1920×1080. Falta probar en OpenPlotter real el sonido, tacto,
  pantalla completa, recuperación de conexión y rendimiento prolongado.

## Completadas

### AIS

- [x] **Implementar CPA/TCPA y avisos de colisión.**
  La app calcula CPA/TCPA con movimiento relativo, límites naranja/rojo
  configurables, popup, lista de contactos, silenciamiento y alarma sonora. El
  radar ampliado muestra etiquetas, rumbo, velocidad y CPA/TCPA solo en alarma.

### Fondeo

- [x] **Implementar la alarma de fondeo.**
  Incluye los recorridos «voy a largar» y «ya estoy fondeado», centro por GPS o
  distancia/demora, radio configurable, persistencia, salida sostenida, pérdida de
  GPS, sonido y desactivación mediante pulsación prolongada.

### Instrumentos

- [x] **Agregar la temperatura del agua a la aplicación.**
  Se muestra bajo LAT/LON en horizontal y como etiqueta en vertical, con
  traducciones ES/EN/FR. Lee `environment.water.temperature` en kelvin y muestra
  °C; sin datos muestra guiones. Pendiente únicamente de comprobación con el
  sensor real a bordo.

- [x] **Mostrar la velocidad media en el popup de SOG.**
  Se presenta junto a mínima y máxima, calculada sobre bloques de cinco segundos
  del periodo configurado sin contar desconexiones como velocidad cero.
