/* eslint-env jest */
'use strict';
const { getLayoutMode } = require('./get-layout-mode');

test('should work out feasible child page layout mode', () => {
    expect(
        getLayoutMode({
            title: 'foo',
            childPageDisplay: 'grid',
            children: [
                { title: 'bar', trailImage: 'bar.jpg' },
                { title: 'baz', trailImage: 'baz.jpg' }
            ]
        })
    ).toEqual('grid');

    expect(
        getLayoutMode({
            title: 'foo',
            childPageDisplay: 'grid',
            children: [
                { title: 'bar', trailImage: 'bar.jpg' },
                { title: 'baz', trailImage: 'baz.jpg' },
                { title: 'test' }
            ]
        })
    ).toEqual('list');

    expect(
        getLayoutMode({
            title: 'foo',
            childPageDisplay: 'list',
            children: [
                { title: 'bar', trailImage: 'bar.jpg' },
                { title: 'baz', trailImage: 'baz.jpg' },
                { title: 'test' }
            ]
        })
    ).toEqual('list');

    expect(
        getLayoutMode({
            title: 'foo',
            childPageDisplay: 'none',
            children: [
                { title: 'bar', trailImage: 'bar.jpg' },
                { title: 'baz', trailImage: 'baz.jpg' },
                { title: 'test' }
            ]
        })
    ).toEqual(false);

    expect(
        getLayoutMode({
            title: 'foo',
            children: [
                { title: 'bar', trailImage: 'bar.jpg' },
                { title: 'baz', trailImage: 'baz.jpg' },
                { title: 'test' }
            ]
        })
    ).toEqual(false);
});
