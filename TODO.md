# Tareas pendientes

Esta lista recoge las tareas del proyecto. Cuando el usuario diga «pon en TODO»,
añadir la tarea aquí sin implementarla salvo que también lo solicite.
Marcar con `[x]` las tareas completadas y conservarlas como referencia.

## Pendientes

- [ ] **Crear una versión de la aplicación para Raspberry Pi.**
  Paquete web e instalador preparados en `raspberry/`, para Pi 5 y pantalla táctil
  1920×1080. Arranque y pantalla completa comprobados en navegador de escritorio.
  Pendiente instalar y validar en OpenPlotter real (sonido, tacto y rendimiento).

- [ ] **Corrección de grados del piloto automático.**

- [ ] **Implementar el control AUTO/STANDBY del piloto NAC-3 desde la aplicación.**
  Trabajo aplazado; implementación retirada. Retomar compatibilidad y configuración
  de `signalk-autopilot`, autorización con token, confirmación del estado real y
  ausencia de reenvíos al reconectar. Actualizar la guía de instalación y validar
  a bordo antes de darlo por terminado.

- [ ] **Añadir CPA/TCPA a los contactos AIS.**
  Mostrar distancia mínima prevista y tiempo hasta el encuentro en la ficha del
  barco, con límites configurables y aviso discreto de riesgo.

- [ ] **Mostrar el estado de actualización de cada instrumento.**
  Distinguir lecturas caducadas de una conexión Signal K activa.

- [ ] **Mostrar distancia recorrida y tiempo de navegación.**
  Añadirlos al popup de SOG con reinicio de viaje.

- [ ] **Mostrar la batería de servicio.**
  Tensión y porcentaje de carga cuando estén disponibles en Signal K.

- [ ] **Implementar alarma de fondeo.**
  Preparación implementada: dos recorridos (al largar / ya fondeado), centro por
  GPS, coordenadas o distancia/demora, zona alrededor del barco, radio y esquema.
  Guarda un borrador local; no activa vigilancia ni envía órdenes a Signal K.
  Fijar/corregir el punto del ancla, configurar el radio y mostrar un panel solo
  durante la vigilancia. Avisos por salida sostenida, pérdida de GPS o conexión.
  Para vigilancia continua, estudiar ejecución en Signal K/Raspberry y sonido
  independiente de la tablet.

## Completadas

- [x] **Agregar la temperatura del agua a la aplicación.**
  Debajo de LAT/LON en horizontal y como etiqueta bajo los indicadores en vertical, con traducciones ES/EN/FR.
  Lee `environment.water.temperature` en kelvin y muestra °C; sin datos muestra guiones.
  Pendiente de comprobación visual y con el sensor real a bordo.

- [x] **Mostrar la velocidad media en el popup de SOG**, junto a mínima y máxima.
  Calculada sobre los bloques de cinco segundos disponibles en el periodo de
  historial configurado, sin contar desconexiones como velocidad cero.
