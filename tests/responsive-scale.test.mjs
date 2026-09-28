import test from 'node:test';
import assert from 'node:assert/strict';
import { getControlScale, scaleStyles } from '../utils/responsiveScale.js';

test('escala usa ambas dimensiones y limita extremos', () => {
    assert.equal(getControlScale(1280, 800), 1);
    assert.equal(getControlScale(1920, 1080), 1.5);
    assert.equal(getControlScale(2560, 1440), 2);
    assert.equal(getControlScale(1920, 720), 1);
    assert.equal(getControlScale(3840, 2160), 2.5);
    assert.equal(getControlScale(0, 0), 1);
});
test('escala dimensiones sin alterar porcentajes, flex ni bordes', () => {
    const base = { panel: { width: '50%', height: 84, fontSize: 14, flex: 1, borderWidth: 1, gap: 6 } };
    assert.deepEqual(scaleStyles(base, 1.5).panel, { width: '50%', height: 126, fontSize: 21, flex: 1, borderWidth: 1, gap: 9 });
    assert.equal(base.panel.height, 84);
});
