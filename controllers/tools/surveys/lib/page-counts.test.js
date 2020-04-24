/* eslint-env jest */
'use strict';
const pageCountsFor = require('./page-counts');

test('pageCountsFor', function () {
    const responses = [
        ...Array(10).fill({ path: '/' }),
        ...Array(100).fill({ path: '/funding' }),
        ...Array(50).fill({ path: '/about' }),
    ];

    expect(pageCountsFor(responses)).toEqual([
        { path: '/funding', count: 100 },
        { path: '/about', count: 50 },
        { path: '/', count: 10 },
    ]);
});
