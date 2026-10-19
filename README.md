# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Documentación del proyecto

- [Manual de usuario ilustrado — PDF](docs/Manual-de-usuario-NavMarina.pdf).
- [Manual de usuario — Word editable](docs/Manual-de-usuario-NavMarina.docx).
- [Guía de instalación y configuración de OpenCPN, OpenPlotter y Signal K](GUIA-INSTALACION-OPENCPN.md).

- [Arquitectura y explicación de las partes del proyecto](ARQUITECTURA.md).
- [Paths de Signal K y configuración del simulador](SIGNALK-SIMULADOR.md).

## Get started

Para generar la aplicación web instalable (PWA), ejecuta `npm run build:web`.
Consulta [la guía de instalación web](WEB-INSTALABLE.md).

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Publicacion y aviso de actualizaciones

El workflow `.github/workflows/release.yml` compila y publica cuando se fusiona
un pull request hacia `main`, desde una rama del propio repositorio. Usa el evento
`pull_request` con `types: [closed]` y exige `merged == true`: cerrar un PR sin
fusionarlo no publica nada. Abrir un PR, subir cambios o hacer un push directo
tampoco genera una release. No tiene disparador manual. La compilacion usa el
codigo integrado en `main` y se publica en el canal `main`.
Los PR de forks externos no publican releases con este workflow.
Los paquetes se publican en GitHub Releases, sin meter binarios en el historial
del codigo. La release permanece en borrador hasta completar la subida.

Cada publicacion incluye `navmarina-web.zip`, `navmarina-raspberry.zip` y
`SHA256SUMS`. El numero de compilacion de GitHub Actions identifica cada version,
aunque no cambie la version comercial de `app.json`. `config/buildInfo.json`
contiene los datos que se incluyen dentro de cada paquete. Las compilaciones
manuales fuera de CI usan el numero 0 y el canal estable por defecto.

Por ahora el flujo publica unicamente web y Raspberry. No compila ni publica
APK, no necesita `EXPO_TOKEN` y el aviso de actualizaciones esta deshabilitado en
la app nativa. La configuracion Android se conserva para retomarla mas adelante.

Al arrancar, el cliente consulta las ultimas 100 releases publicas por HTTPS,
sin tokens en la app, con un limite de espera de 8 segundos. Solo avisa si hay
una compilacion mayor del mismo canal y un paquete para su plataforma. Los
borradores y releases ajenas se ignoran. Sin Internet, ante errores o si se
agota la cuota publica de GitHub, el arranque continua sin bloquearse.
Referencia de GitHub: https://docs.github.com/en/rest/releases/releases

En web, el aviso ofrece Descargar o Mas tarde y el ZIP se publica manualmente
en el servidor. En Raspberry, tras instalar una vez el nuevo actualizador, ofrece
Actualizar con confirmacion, descarga y verifica el paquete y lo instala localmente.
Al terminar el usuario pulsa Abrir nueva version para recargar. El perfil del
navegador se conserva. Consulta `raspberry/README.md` para el proceso y sus limites.
Las instalaciones anteriores a esta funcion necesitan actualizarse una vez
manualmente para empezar a recibir avisos.

La automatizacion se aplica a las fusiones hacia `main` cuando GitHub dispone
del workflow actualizado. No genera releases para fusiones anteriores. En la
Raspberry el usuario decide cuando instalar la version publicada desde la app.

## Comprobar la estabilidad visual (CLS)

La consola mantiene estables las cajas de texto de los instrumentos y muestra el
aviso de actualizacion sobre la pantalla sin desplazarla. El panel del waypoint se
oculta cuando no hay destino; los instrumentos aprovechan el espacio disponible y
se reajustan cuando aparece o desaparece el destino.
La compilacion web y la de Raspberry incluyen los estilos iniciales
para evitar el margen por defecto antes de que cargue React.

Se puede repetir la medicion con Chrome o Chromium instalado:

```bash
npm run build:web
npm install --prefix artifacts/cls-tools --no-save --package-lock=false playwright-core
node scripts/measure-cls.mjs current
```

Si el navegador no se detecta, configura `NAVMARINA_BROWSER` con su ruta.
La prueba sirve `dist`, simula Signal K con datos cambiantes y mide ventanas CLS
durante 10,5 segundos por escenario. Los escenarios dinamicos reciben ademas
un waypoint y un aviso de actualizacion, con fondeo activo. Guarda las entradas
de desplazamiento y capturas en `artifacts/cls/`.

Medicion local en Chrome, antes y despues del ajuste (octubre de 2026):

| Escenario | Antes | Despues |
| --- | ---: | ---: |
| Datos cambiantes, 1920 x 1080 | 0,0255 | 0,0070 |
| Waypoint y actualizacion, 1920 x 1080 | 0,0697 | 0,0733 |
| Waypoint y actualizacion, 1280 x 800 | 0,0837 | 0,0461 |
| Datos cambiantes, 768 x 1024 | 0,0128 | 0,0024 |

Son pruebas simuladas locales; no sustituyen una medicion prolongada durante el
uso real de la Raspberry. Los cambios de datos siguen generando pequenas entradas
de desplazamiento de texto, aunque las cajas de los instrumentos permanezcan fijas.
La aparicion y ocultacion del waypoint vuelve a reajustar los paneles; por eso los
resultados dinamicos incluyen ese cambio de distribucion y pueden superar los
obtenidos cuando el espacio del destino se reservaba permanentemente.
