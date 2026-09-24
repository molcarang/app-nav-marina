# Traducciones de la consola

La preferencia `settings.language` (`es`, `en` o `fr`) se guarda con los demás ajustes.
`ConsoleScreen` la entrega a `LanguageProvider`, que actualiza sus componentes
y modales al cambiar el idioma, sin reiniciar la conexión Signal K.

- `es.js`, `en.js` y `fr.js`: diccionarios con las mismas claves.
- `translate.js`: catálogo `SUPPORTED_LANGUAGES`, selección de idioma, formato regional, respaldo español e interpolación.
- `LanguageProvider.js`: contexto React y hook `useTranslation()`.

En un componente:

```js
const { t, language } = useTranslation();
// Texto simple: t('sail')
// Texto con datos: t('historyHeading', { metric: 'TWS' })
```

Añadir cada texto nuevo a los tres diccionarios. Guardar claves, no frases
traducidas, en estados de mensajes: así también cambian al seleccionar idioma.
Los gráficos usan el idioma para las horas. Se conservan las siglas náuticas,
las unidades, los nombres AIS y los identificadores y paths de Signal K.
Los hemisferios GPS siguen la notación internacional N/S/E/W.

El idioma predeterminado, también antes de cargar ajustes o en un error de
arranque fuera del proveedor, es español. La pantalla de telemetría permanece
desactivada; sus componentes reutilizables también reciben traducciones.

Validación: `node --test tests/localization.test.mjs` comprueba paridad de claves,
parámetros, interpolación y respaldo. Para revisar la interfaz, alternar idiomas
en configuración, abrir los gráficos TWS/SOG y un barco AIS, girar la tablet
y reiniciar la app para comprobar que se conserva la selección.
