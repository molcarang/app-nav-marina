# Copia de releases de OpenBoat a Google Drive

El workflow ya incluye una copia opcional del ZIP de Raspberry después de publicar
la release. Se ejecuta con el flujo habitual: un pull request del mismo repositorio
fusionado en `main`. La publicación en GitHub y la copia son trabajos separados;
si Drive falla, la release publicada permanece disponible.

El destino predeterminado es la carpeta indicada:
https://drive.google.com/drive/u/1/folders/14OemrNJZEA2VZ3F7Uf6JCbaWVcc3ZEN0

Cada release tiene una subcarpeta con su etiqueta. Allí se copian
`navmarina-raspberry.zip` y `SHA256SUMS`, tras verificar la suma SHA-256 del ZIP.
Las versiones anteriores se conservan. Reintentar el trabajo usa la misma ruta.

## Autorizar Google Drive una vez

1. Instala [rclone](https://rclone.org/install/) en tu ordenador o Raspberry.
2. Ejecuta `rclone config` y crea una conexión llamada exactamente `gdrive`,
   de tipo Google Drive. Sigue el asistente y autoriza con la cuenta que tiene
   permiso de escritura en la carpeta de destino. Selecciona acceso de lectura
   y escritura a Drive: `drive.file` solo ve archivos creados o autorizados para
   esa aplicación y puede no permitir usar una carpeta existente. Consulta las
   [opciones de Drive](https://rclone.org/drive/). Deja los ajustes avanzados
   predeterminados, salvo los necesarios para tu cuenta.
3. Ejecuta `rclone config file` para localizar su fichero de configuración.
   Copia únicamente la sección `[gdrive]` y sus valores. Debe incluir el token
   OAuth con `refresh_token`; si utilizaste un cliente OAuth propio, incluye
   también `client_id` y `client_secret`. No uses una configuración cifrada
   sin descifrar para este secreto.
4. En GitHub, abre el repositorio → **Settings → Secrets and variables → Actions**.
5. En **Secrets → New repository secret**, crea `GDRIVE_RCLONE_CONFIG` y pega
   esa sección completa. No subas el fichero al repositorio ni pegues el token
   en el chat.
6. En **Variables → New repository variable**, crea `GDRIVE_UPLOAD_ENABLED`
   con el valor `true`.

La autorización de la conexión de Google Drive del chat no se transfiere a
GitHub Actions: el workflow necesita su propio secreto OAuth. Si usas un cliente
OAuth propio en modo de pruebas, revisa la caducidad de sus autorizaciones antes
de dejar la automatización funcionando a largo plazo.

## Opciones

No necesitas crear más variables para el destino y ZIP ya seleccionados.
Si quieres cambiarlos más adelante, usa variables de repositorio:

| Variable | Valor |
| --- | --- |
| `GDRIVE_FOLDER_ID` | Solo el identificador de la carpeta, sin el enlace completo. |
| `GDRIVE_UPLOAD_FILES` | `raspberry`, `pdf` o `both`. Predeterminado: `raspberry`. |

Para desactivar la copia, cambia `GDRIVE_UPLOAD_ENABLED` a `false`.

## Comprobar la primera copia

Después del siguiente merge, abre **Actions → Build and publish OpenBoat** y
revisa el trabajo **Copy release files to Google Drive**. La cuenta autorizada
debe tener acceso de escritura y espacio disponible. No se han subido archivos
a Drive durante la preparación de este cambio.

Si falla únicamente la copia, usa **Re-run failed jobs** en GitHub Actions;
no necesitas publicar otra release.
