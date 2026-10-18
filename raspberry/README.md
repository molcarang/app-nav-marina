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

## Actualizaciones desde la aplicacion

Instala manualmente una vez este paquete nuevo con `bash install.sh`, sin sudo.
Este paso migra el servidor local y conserva el perfil Chromium y sus ajustes.
Python debe ser 3.9 o posterior. El servicio se reinicia al ejecutar el instalador.

A partir de entonces, al detectar una nueva release, NavMarina ofrece Actualizar
y Mas tarde. Actualizar solicita confirmacion con Instalar ahora. El servidor
local descarga el ZIP Raspberry y SHA256SUMS desde la release seleccionada del
repositorio, comprueba integridad, canal y version, extrae en una carpeta temporal
y selecciona la nueva version mediante un enlace simbolico cambiado atomicamente.
No ejecuta el install.sh descargado y no necesita permisos sudo ni tokens GitHub.
Los ficheros se sirven solo desde 127.0.0.1:8765. La API exige origen local y un
token de sesion antes de iniciar una instalacion.

La interfaz muestra descarga, verificacion e instalacion. Al terminar, pulsa
Abrir nueva version para recargar la pantalla. Hasta entonces la pantalla actual
permanece abierta. El codigo Python ya cargado sigue atendiendo; los ficheros de
servidor nuevos se cargan al siguiente reinicio del servicio. El protocolo debe
ser compatible (version 1); si no lo es, se rechaza el paquete.

Si falla la descarga o la validacion, la version instalada sigue seleccionada.
Los ajustes en el directorio browser no forman parte de la sustitucion y las
versiones anteriores se conservan bajo ~/.local/share/navmarina/releases.
No cierres la sesion ni apagues la Raspberry durante la instalacion. Los paquetes
antiguos que no incorporan este actualizador siguen ofreciendo descarga manual.

Las pruebas automaticas cubren integridad, extraccion, autorizacion HTTP y
conservacion de ajustes. La sustitucion de enlaces se comprueba cuando el sistema
permite crear enlaces simbolicos; falta validar el flujo en la Raspberry real.
