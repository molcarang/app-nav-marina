# APK de prueba para Android

El perfil `preview` de `eas.json` genera una APK con el código y los recursos
incluidos. Instalada en la tablet, no necesita Expo Go, Metro ni un PC encendido.
Para recibir datos necesita acceso por red al servidor Signal K.

## Generar

Proyecto vinculado: https://expo.dev/accounts/amolines/projects/app-nav-marina
La clave de firma Android está gestionada por EAS en esa cuenta.

Desde la carpeta del proyecto, en PowerShell:

```powershell
npx.cmd eas-cli login
npx.cmd eas-cli build --platform android --profile preview
```

Si Git no está instalado en el PC, añade antes de compilar:

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
```

La primera compilación puede pedir crear/vincular el proyecto de Expo y generar
la clave de firma Android. Usa la misma cuenta y conserva esa clave para poder
instalar versiones futuras como actualizaciones. El identificador Android es
`com.navmarina.app`.

EAS compila en la nube y entrega un enlace de descarga al terminar. Necesitas
Internet para compilar y descargar; no para usar la app con Signal K local.
El archivo `.easignore` excluye las exportaciones locales y `yarn.lock` para que
la compilación use `package-lock.json` y npm.

## Instalar y comprobar en la tablet

1. Abre el enlace de la compilación y descarga la APK.
2. Permite instalar desde ese navegador si Android lo solicita e instala.
3. Abre la app desde su icono y configura la dirección de Signal K en Settings,
   por ejemplo `http://192.168.1.50:3000`, usando la IP real del servidor.
4. Conecta la tablet a la red de OpenPlotter. No uses `localhost` como servidor.
5. Comprueba la conexión y compara los valores con el explorador de datos de
   Signal K. Para comprobar datos reales, desactiva los simuladores del servidor.
6. Cierra y vuelve a abrir la aplicación con el PC apagado para verificar su
   funcionamiento independiente. Comprueba también alarma sonora, AIS y waypoint
   cuando sus datos estén disponibles.

La APK tiene almacenamiento independiente de Expo Go: configura de nuevo la
dirección del servidor y tus preferencias. Se permite HTTP/WebSocket sin TLS
mediante `expo-build-properties` para conectar con servidores Signal K locales.

## Referencias

- https://docs.expo.dev/build-reference/apk/
- https://docs.expo.dev/build/setup/
- https://docs.expo.dev/versions/v54.0.0/sdk/build-properties/
