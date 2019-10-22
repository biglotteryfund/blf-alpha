/* eslint-env jest */
'use strict';
const { getChildrenLayoutMode } = require('./index');

describe('CMS page templates', () => {
    it('should work out feasible child page layout mode', () => {
        const pageGrid = {
            title: 'foo',
            childPageDisplay: 'grid',
            children: [
                {
                    title: 'bar',
                    trailImage: 'bar.jpg'
                },
                {
                    title: 'baz',
                    trailImage: 'baz.jpg'
                }
            ]
        };

        expect(getChildrenLayoutMode(pageGrid)).toEqual('grid');

        const pageGridMissingImages = {
            title: 'foo',
            childPageDisplay: 'grid',
            children: [
                {
                    title: 'bar',
                    trailImage: 'bar.jpg'
                },
                {
                    title: 'baz',
                    trailImage: 'baz.jpg'
                },
                {
                    title: 'test'
                }
            ]
        };

        expect(getChildrenLayoutMode(pageGridMissingImages)).toEqual('list');

        const pageList = {
            title: 'foo',
            childPageDisplay: 'list',
            children: [
                {
                    title: 'bar',
                    trailImage: 'bar.jpg'
                },
                {
                    title: 'baz',
                    trailImage: 'baz.jpg'
                },
                {
                    title: 'test'
                }
            ]
        };

        expect(getChildrenLayoutMode(pageList)).toEqual('list');

        const pageNone = {
            title: 'foo',
            childPageDisplay: 'none',
            children: [
                {
                    title: 'bar',
                    trailImage: 'bar.jpg'
                },
                {
                    title: 'baz',
                    trailImage: 'baz.jpg'
                },
                {
                    title: 'test'
                }
            ]
        };

        expect(getChildrenLayoutMode(pageNone)).toEqual(false);

        const pageUnspecified = {
            title: 'foo',
            children: [
                {
                    title: 'bar',
                    trailImage: 'bar.jpg'
                },
                {
                    title: 'baz',
                    trailImage: 'baz.jpg'
                },
                {
                    title: 'test'
                }
            ]
        };

        expect(getChildrenLayoutMode(pageUnspecified)).toEqual(false);
    });
});
