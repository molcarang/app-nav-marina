# Posición simulada para OpenCPN

Este plugin lee `simulation.gps.latitude` y `simulation.gps.longitude` del barco
propio cada segundo y publica el objeto estándar `navigation.position`.
Requiere que el simulador numérico siga activo. Omite coordenadas inválidas o con
una antigüedad superior a 10 segundos y conserva la fecha de la lectura más antigua.

## Instalación en OpenPlotter

1. Copia y extrae `signalk-gps-demo-bridge.zip` en tu carpeta personal.
   Debe existir `~/signalk-gps-demo-bridge/package.json`.
2. Abre una terminal como el usuario que ejecuta Signal K:

   ```sh
   cd ~/.signalk
   npm install "$HOME/signalk-gps-demo-bridge"
   ```

   Si Signal K utiliza otra carpeta de configuración, sustituye `~/.signalk`.
3. Reinicia Signal K. En la configuración de plugins activa
   **GPS Demo - posicion para OpenCPN** y guarda.
4. Abre `http://openplotter.local:3000/signalk/v1/api/vessels/self/navigation/position`.
   Debe aparecer `value` con `latitude` y `longitude`, y un timestamp que se actualiza.
5. En OpenCPN conserva la entrada Signal K, comprueba que recibe posición propia,
   activa Navegar hacia un waypoint y cierra Opciones.
6. Comprueba en Data Monitor si salen RMB/APB/XTE por la conexión TCP de salida.
   Signal K debe tener la entrada NMEA 0183 TCP Server correspondiente en el puerto 10110.

Desactiva este plugin al terminar la simulación, antes de utilizar un GPS real.
Publicar posición no activa por sí solo un destino ni integra los waypoints en la app.

API utilizada: https://demo.signalk.org/documentation/_signalk/server-api/ServerAPI.html
