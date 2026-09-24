import { createContext, useContext } from 'react';
import { normalizeLanguage, translate } from './translate';

const LanguageContext = createContext('es');
export { normalizeLanguage } from './translate';
export function LanguageProvider({ language, children }) {
    return <LanguageContext.Provider value={normalizeLanguage(language)}>{children}</LanguageContext.Provider>;
}
export function useTranslation() {
    const language = useContext(LanguageContext);
    return { language, t: (key, params = {}) => translate(language, key, params) };
}
