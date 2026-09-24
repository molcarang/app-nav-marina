import es from './es.js';
import en from './en.js';
import fr from './fr.js';

const dictionaries = { es, en, fr };
export const SUPPORTED_LANGUAGES = [
    { code: 'es', label: 'Español', locale: 'es-ES' },
    { code: 'en', label: 'English', locale: 'en-GB' },
    { code: 'fr', label: 'Français', locale: 'fr-FR' },
];
export const normalizeLanguage = language => SUPPORTED_LANGUAGES.some(item => item.code === language) ? language : 'es';
export const getLanguageLocale = language => SUPPORTED_LANGUAGES.find(item => item.code === normalizeLanguage(language)).locale;

/** Traduce únicamente presentación: los identificadores de datos no cambian. */
export function translate(language, key, params = {}) {
    const dictionary = dictionaries[normalizeLanguage(language)];
    return (dictionary[key] ?? es[key] ?? key)
        .replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
}
