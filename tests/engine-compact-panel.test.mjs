import test from 'node:test';
import assert from 'node:assert/strict';
import { isEngineCompactPanelActive } from '../features/console/model/engineCompactPanel.js';

test('panel compacto sustituye fondeo solo con RPM y SOG superior a 1,5 kn', () => {
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: 1800, sogKnots: 1.51 }), true);
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: 900, sogKnots: '4.0' }), true);
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: 900, sogKnots: '4,0' }), true);
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: 1800, sogKnots: 1.5 }), false);
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: 1800, sogKnots: 0 }), false);
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: 0, sogKnots: 4 }), false);
    assert.equal(isEngineCompactPanelActive({ connected: false, rpm: 1800, sogKnots: 4 }), false);
    assert.equal(isEngineCompactPanelActive({ connected: true, rpm: null, sogKnots: 4 }), false);
});
