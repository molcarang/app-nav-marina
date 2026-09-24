const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const React = require('react');

test('los gradientes no contienen texto que Android intente clonar como componente', () => {
    const source = fs.readFileSync(require.resolve('../components/gauges/shared/GaugeDefs.js'), 'utf8');
    const { code } = babel.transformSync(source, { configFile: false, babelrc: false,
        plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'classic' }], '@babel/plugin-transform-modules-commonjs'] });
    const exports = {};
    vm.runInNewContext(code, { exports, React,
        require: () => ({ LinearGradient: 'LinearGradient', RadialGradient: 'RadialGradient', Stop: 'Stop' }) });
    const gradients = React.Children.toArray(exports.GaugeDefs().props.children);
    assert.ok(gradients.length > 0);
    for (const gradient of gradients) {
        const stops = React.Children.toArray(gradient.props.children);
        assert.ok(stops.length >= 2);
        for (const stop of stops) {
            assert.ok(React.isValidElement(stop), `Texto inesperado en ${gradient.props.id}`);
            assert.equal(stop.type, 'Stop');
        }
    }
});
