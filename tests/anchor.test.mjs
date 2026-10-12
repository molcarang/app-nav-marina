import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateAnchor, parseAnchorNumber, validAnchorDraft } from '../features/console/model/anchor.js';
import { projectAisPosition } from '../components/gauges/shared/aisProjection.js';

test('estima el ancla con distancia horizontal y demora verdadera', () => {
    const origin = { latitude: 28, longitude: -13 };
    for (const bearing of [0, 90, 180, 270]) {
        const center = estimateAnchor(origin, 50, bearing);
        const projected = projectAisPosition(origin, center, 0, 6, 6);
        assert.ok(Math.abs(projected.distanceNm * 1852 - 50) < 0.001);
        if (bearing === 0) assert.ok(center.latitude > origin.latitude);
        if (bearing === 90) assert.ok(center.longitude > origin.longitude);
    }
    assert.ok(estimateAnchor({ latitude: 0, longitude: 179.9999 }, 50, 90).longitude < 0);
    assert.equal(estimateAnchor(null, 50, 0), null);
    assert.equal(estimateAnchor(origin, -1, 0), null);
    assert.equal(estimateAnchor(origin, 50, 361), null);
});
test('valida preparación y entradas decimales sin convertir vacíos en cero', () => {
    assert.equal(parseAnchorNumber('22,5'), 22.5);
    assert.ok(Number.isNaN(parseAnchorNumber(' ')));
    const draft = { method: 'zone', center: { latitude: 0, longitude: 0 }, radius: 50 };
    assert.ok(validAnchorDraft(draft));
    assert.equal(validAnchorDraft({ ...draft, radius: 0 }), false);
    assert.equal(validAnchorDraft({ ...draft, center: { latitude: 91, longitude: 0 } }), false);
    assert.equal(validAnchorDraft({ ...draft, method: 'active' }), false);
});
