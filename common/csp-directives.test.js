// @ts-nocheck
/* eslint-env jest */
'use strict';

const cspDirectives = require('./csp-directives');

test('should return default csp directives', () => {
    expect(cspDirectives()).toMatchSnapshot();
});
