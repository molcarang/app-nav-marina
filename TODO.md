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

- [ ] **Agregar la temperatura del agua a la aplicación.**

## Completadas

- [x] **Mostrar la velocidad media en el popup de SOG**, junto a mínima y máxima.
  Calculada sobre los bloques de cinco segundos disponibles en el periodo de
  historial configurado, sin contar desconexiones como velocidad cero.
