import test from 'node:test';
import assert from 'node:assert/strict';
import es from '../localization/es.js';
import en from '../localization/en.js';
import fr from '../localization/fr.js';
import { getLanguageLocale, normalizeLanguage, translate } from '../localization/translate.js';

for (const dictionary of [en, fr]) test('Los idiomas cubren las mismas claves y parámetros', () => {
    assert.deepEqual(Object.keys(es).sort(), Object.keys(dictionary).sort());
    for (const key of Object.keys(es)) {
        assert.ok(es[key].trim(), key);
        assert.ok(dictionary[key].trim(), key);
        const parameters = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
        assert.deepEqual(parameters(es[key]), parameters(dictionary[key]), key);
    }
});

test('Traduce parámetros sin perder el cero y aplica el idioma de respaldo', () => {
    assert.equal(translate('en', 'historyHeading', { metric: 'TWS' }), 'TWS · HISTORY');
    assert.equal(translate('es', 'historyHeading', { metric: 'SOG' }), 'SOG · HISTORIAL');
    assert.equal(translate('en', 'aisTarget', { name: 'Lucero', distance: 0 }), 'Lucero, 0 nautical miles');
    assert.equal(normalizeLanguage('fr'), 'fr');
    assert.equal(getLanguageLocale('fr'), 'fr-FR');
    assert.equal(translate('fr', 'sail'), 'VOILE');
    assert.equal(translate('fr', 'aisTarget', { name: 'Lucero', distance: 0 }), 'Lucero, 0 milles nautiques');
    assert.equal(normalizeLanguage('de'), 'es');
    assert.equal(translate('de', 'sail'), 'VELA');
    assert.equal(translate('en', 'unknown.key'), 'unknown.key');
});
