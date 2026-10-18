# Simulación de instrumentos y contactos AIS

El simulador numérico original no admite objetos, texto ni contextos por barco.
Se han separado sus datos en dos partes, sin modificar el fichero original del proyecto.

## Instrumentos propios

`simulator-instruments.json` contiene los 14 elementos originales no AIS.
Con Signal K detenido, sustituye el contenido de `~/.signalk/plugin-config-data/simulator.json`
por este fichero (guarda antes una copia). Si tu servidor usa otra carpeta de configuración,
usa su carpeta `plugin-config-data`. También puedes copiar `configuration.items` al editor
de configuración del plugin numérico, según la interfaz disponible.

Se conservan los paths y valores actuales de la app. También se conservan las dos entradas
originales de `propulsion.0.revolutions`, que publican valores distintos; no forman parte
de la corrección AIS.

## Cuatro barcos independientes

1. Copia la carpeta completa `signalk-ais-demo` al servidor, por ejemplo a
   `/home/pi/signalk-ais-demo` (ajusta la ruta a tu usuario).
2. Desde la carpeta de configuración de Signal K instala el plugin local:

   ```sh
   cd ~/.signalk
   npm install /home/pi/signalk-ais-demo
   ```

3. Reinicia Signal K y activa **AIS Demo - cuatro barcos simulados** en la configuración
   de plugins. Si tu instalación usa otro usuario o directorio, ejecuta la instalación
   en el directorio de configuración de ese servicio.
4. Comprueba `/signalk/v1/api/vessels`: deben aparecer cuatro barcos adicionales con
   MMSI 224123450, 244987654, 225888111 y 311000999, al mismo nivel que tu barco.

`boats.json` conserva nombres, coordenadas, velocidades en m/s y rumbos en radianes del
fichero proporcionado. El plugin publica cada segundo posiciones fijas; no calcula
desplazamiento. Los metadatos `name` y `mmsi` se envían con path vacío, y los datos de
navegación con paths relativos al contexto de cada barco.

Las entradas erróneas antiguas bajo `vessels.self.vessels` pueden seguir en memoria hasta
reiniciar el servidor. Desactiva este plugin cuando uses tráfico real.

La app recibe los contactos; dibujarlos sobre los anillos AIS sigue pendiente.
