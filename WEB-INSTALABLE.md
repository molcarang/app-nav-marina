# NavMarina web instalable

## Generar

```sh
npm run build:web
```

El resultado está en `dist/`. Publica el contenido completo en la raíz de un
servidor HTTPS, con `index.html` como documento de inicio. No abras el HTML con
`file://`. La compilación actual usa rutas desde `/`, no un subdirectorio.
Configura el servidor para devolver `index.html` en las rutas de navegación
que no correspondan a un archivo; es una aplicación de una sola página.

Sirve `sw.js`, los HTML y `manifest.webmanifest` con `Cache-Control: no-cache`.
Los archivos de `_expo/static/` con nombre hash pueden usar caché permanente.
Publica todos los archivos de una versión juntos; conserva los recursos de la
versión anterior durante el despliegue para las ventanas que sigan abiertas.

## Instalar en una tablet Android

1. Abre la dirección HTTPS en Chrome.
2. En el menú del navegador, selecciona **Instalar aplicación** o **Añadir a la
   pantalla de inicio** y confirma.
3. Abre **NavMarina** desde su icono. Admite orientación vertical y horizontal.
4. Configura la dirección de Signal K en los ajustes.

Para probar en el mismo ordenador puedes servir `dist/` desde `localhost`.
Una dirección HTTP de la red local como `http://192.168.x.x` no cumple el
requisito de instalación PWA en una tablet; usa HTTPS con un certificado válido.

## Conexión y actualizaciones

Después de la primera carga correcta y de que el service worker termine de
guardar los archivos, la interfaz puede volver a abrirse sin Internet. Los datos
de navegación en vivo necesitan acceso a Signal K; los mapas externos necesitan
su propia conexión. La PWA no guarda respuestas de telemetría ni mapas.

Una web HTTPS necesita que Signal K sea accesible por HTTPS/WSS y que permita el
origen de la web mediante CORS cuando corresponda. Una conexión HTTP/WS a Signal K
desde una web HTTPS puede ser bloqueada por contenido mixto. Para el barco,
puedes servir ambos mediante un proxy HTTPS en la red local. Conserva la dirección
de Signal K correcta para la tablet: `localhost` se refiere a la propia tablet.

Las actualizaciones se descargan en segundo plano. Cierra todas las ventanas de
NavMarina, incluida la instalada, y vuelve a abrir para activar una versión nueva.
Los ajustes locales se conservan. Comprueba en la tablet instalación, giro,
reapertura sin conexión, reconexión a Signal K y prueba de sonido de las alarmas.
