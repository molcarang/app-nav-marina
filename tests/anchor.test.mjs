import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAnchorWatch, anchorWatchStatus, hasFreshAnchorPosition, estimateAnchor, parseAnchorNumber, validAnchorDraft } from '../features/console/model/anchor.js';
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
    const draft = { method: 'manual', center: { latitude: 0, longitude: 0 }, radius: 50 };
    for (const method of ['drop', 'estimate', 'manual']) {
        assert.ok(validAnchorDraft({ ...draft, method }));
    }
    assert.equal(validAnchorDraft({ ...draft, method: 'zone' }), false);
    assert.equal(validAnchorDraft({ ...draft, radius: 0 }), false);
    assert.equal(validAnchorDraft({ ...draft, center: { latitude: 91, longitude: 0 } }), false);
    assert.equal(validAnchorDraft({ ...draft, method: 'active' }), false);
});

test('vigila el radio y distingue perdida de GPS de posicion segura', () => {
    const center = { latitude: 28, longitude: -13 };
    const draft = { method: 'drop', center, radius: 50 };
    const now = 100000;
    assert.equal(anchorWatchStatus(null, center, now, true, now), 'inactive');
    assert.equal(anchorWatchStatus(draft, center, now, true, now), 'watching');
    assert.equal(anchorWatchStatus(draft, estimateAnchor(center, 60, 90), now, true, now), 'outside');
    assert.equal(anchorWatchStatus(draft, estimateAnchor(center, 40, 90), now, true, now), 'watching');
    assert.equal(anchorWatchStatus(draft, center, now, false, now), 'gpsLost');
    assert.equal(anchorWatchStatus(draft, center, now - 30000, true, now), 'gpsLost');
    assert.equal(anchorWatchStatus(draft, null, now, true, now), 'gpsLost');
    assert.equal(anchorWatchStatus(draft, center, now + 1000, true, now), 'gpsLost');
});

test('una lectura entre ticks sigue siendo reciente y caduca a los 30 segundos', () => {
    const position = { latitude: 28, longitude: -13 };
    const lastTick = 100000;
    const receivedAt = 100500;
    const renderTime = 100501;
    assert.equal(hasFreshAnchorPosition(position, receivedAt, true, Math.max(lastTick, renderTime)), true);
    assert.equal(hasFreshAnchorPosition(position, receivedAt, true, receivedAt + 29999), true);
    assert.equal(hasFreshAnchorPosition(position, receivedAt, true, receivedAt + 30000), false);
    assert.equal(hasFreshAnchorPosition(position, receivedAt, false, renderTime), false);
});

test('ignora un salto aislado y exige nuevas lecturas durante cinco segundos', () => {
    let state = filterAnchorWatch(null, 'outside', 100000);
    assert.equal(state.status, 'pending');
    // Reutilizar una lectura, aunque pase el tiempo, no confirma la salida.
    for (let i = 0; i < 10; i++) state = filterAnchorWatch(state, 'outside', 100000);
    assert.equal(state.status, 'pending');
    state = filterAnchorWatch(state, 'outside', 104999);
    assert.equal(state.status, 'pending');
    state = filterAnchorWatch(state, 'outside', 105000);
    assert.equal(state.status, 'outside');
    assert.equal(filterAnchorWatch(state, 'outside', 106000).status, 'outside');
    assert.equal(filterAnchorWatch(state, 'watching', 107000).status, 'watching');
});

test('volver dentro o perder GPS reinicia la confirmacion', () => {
    for (const resetStatus of ['watching', 'gpsLost', 'inactive']) {
        let state = filterAnchorWatch(null, 'outside', 100000);
        state = filterAnchorWatch(state, 'outside', 104000);
        state = filterAnchorWatch(state, resetStatus, 105000);
        assert.equal(state.status, resetStatus);
        state = filterAnchorWatch(state, 'outside', 106000);
        assert.equal(state.status, 'pending');
        assert.equal(filterAnchorWatch(state, 'outside', 110000).status, 'pending');
        assert.equal(filterAnchorWatch(state, 'outside', 111000).status, 'outside');
    }
});

test('una nueva activacion o un retroceso de reloj empieza otra confirmacion', () => {
    const confirmed = filterAnchorWatch(filterAnchorWatch(null, 'outside', 100000), 'outside', 105000);
    assert.equal(filterAnchorWatch(null, 'outside', 106000).status, 'pending');
    assert.equal(filterAnchorWatch(confirmed, 'outside', 90000).status, 'pending');
});
