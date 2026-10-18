# NavMarina para Raspberry Pi 5

Dashboard web local para OpenPlotter con escritorio y pantalla táctil 1920×1080.
No requiere Expo Go, Metro, Node.js en la Raspberry ni conexión a Internet durante
el uso. Chromium y Python 3 deben estar instalados previamente.

## Instalar

1. Copia y extrae `navmarina-raspberry.zip` en una carpeta de la Raspberry.
2. Abre una terminal en la carpeta que contiene `install.sh` y ejecuta:

   ```bash
   bash install.sh
   ```

   Hazlo con el usuario del escritorio, **sin sudo**. Si faltan dependencias:
   `sudo apt install chromium python3` (esto sí requiere conexión a los repositorios).
3. Abre **NavMarina** desde el escritorio o el menú. Si el escritorio pregunta,
   permite ejecutar el acceso directo. El navegador se abre como ventana de app,
   maximizada y con un perfil separado del navegador habitual.
4. Pulsa el icono de pantalla completa de la cabecera. Vuelve a pulsarlo para
   recuperar la ventana y cerrarla mediante la X del escritorio. Con teclado,
   también puedes salir de pantalla completa con Escape.
5. En Settings comprueba que Signal K apunta a `http://localhost:3000`.
   Esta dirección supone que Signal K se ejecuta en la misma Raspberry.

El servidor del dashboard escucha solo en `127.0.0.1:8765`; no ocupa el puerto
3000 ni modifica Signal K, OpenCPN o la configuración CAN. El servicio arranca al
iniciar sesión; el dashboard se abre manualmente. El perfil dedicado conserva los
ajustes. La ventana usa una política de reproducción que permite las alarmas;
comprueba el botón de prueba de sonido y el volumen/salida de audio del sistema.

## Comprobaciones en el barco

- Usa resolución 1920×1080 y zoom del navegador al 100% como punto de partida.
- Prueba el toque doble de SOG/TWS, pulsación larga de reset, AIS y Settings.
- Comprueba los paneles con waypoint activo y sin él.
- Comprueba el sonido y el modo noche.
- Comprueba recuperación de conexión y apertura sin Internet.
- Mantén OpenCPN abierto para evaluar rendimiento con la carga habitual.
- Si el sonido no funciona, revisa la salida HDMI/altavoz y pulsa la prueba.
- Si la lectura funciona pero el waypoint no, revisa errores HTTP/CORS de Signal K:
  el dashboard y Signal K usan distintos puertos. Autoriza únicamente el origen
  local necesario en la configuración de tu servidor si lo exige.

La exportación local no equivale a una prueba física en Raspberry: quedan por
validar tacto, fluidez, audio y configuración específica de OpenPlotter.

## Diagnóstico y actualizaciones

```bash
systemctl --user status navmarina.service
journalctl --user -u navmarina.service -n 50
```

Para actualizar, cierra la ventana, extrae el nuevo paquete y ejecuta su instalador.
Vuelve a abrir NavMarina. El perfil y los ajustes se conservan.

Para detener/desactivar el servidor:

```bash
systemctl --user disable --now navmarina.service
```

## Generar el paquete desde el proyecto

```bash
node scripts/build-raspberry.mjs
```

El resultado queda en `artifacts/navmarina-raspberry`. Copia la carpeta completa,
incluida `web`; no abras `index.html` directamente con `file://`.
