# Simulación temporal AIS

Vista local de la app con un transporte simulado en el navegador. No se instala
ningún plugin ni se envían datos a Signal K. El código de la app no importa esta
carpeta. Los ajustes de esta vista se restauran al abandonarla.

Preparar desde PowerShell en la raíz del proyecto:

```powershell
$env:NAVMARINA_PWA = '1'
npx.cmd expo export --platform web --output-dir artifacts/ais-simulation-web
node simulation/ais-collision-preview/server.mjs
```

Abrir http://127.0.0.1:4173. Son escenarios de prueba con límites iniciales naranja
0,50 NM / 15 min y rojo 0,20 NM / 5 min. El barco propio y los blancos con velocidad
se desplazan; los cambios de escenario reinician la posición del barco propio.

1. Activar DATOS AIS y pulsar **Naranja · barco A**: popup y pitido corto.
2. Cerrar el popup y pulsar la campana de la app: silencio. Cerrar no silencia.
3. Pulsar **Rojo · barco A**: reaparece el popup y se reactiva con pitido largo.
4. Silenciar y volver a naranja: tras confirmarse la bajada (8 s), sigue silenciado.
5. Silenciar y pulsar **Añadir barco B**: se reactiva aunque A siga en rojo.
6. **Quitar alarmas** oculta la campana y prepara el siguiente episodio.

**Terminar simulación** abandona la vista, corta el sonido y detiene este servidor.
Para quitar los archivos después, borrar esta carpeta y `artifacts/ais-simulation-web`.
No se genera ninguna APK.
