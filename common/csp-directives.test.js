// @ts-nocheck
/* eslint-env jest */
'use strict';

const cspDirectives = require('./csp-directives');

describe('cspDirectives', () => {
    test('should return default csp directives', () => {
        expect(cspDirectives()).toMatchSnapshot();
    });

    test('should return additional directives when hotjar is enabled', () => {
        expect(cspDirectives({ enableHotjar: true })).toMatchSnapshot();
    });

    test('should return additional directives when localhost is enabled', () => {
        expect(cspDirectives({ allowLocalhost: true })).toMatchSnapshot();
    });
});
