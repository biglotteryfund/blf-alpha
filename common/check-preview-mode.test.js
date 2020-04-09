/* eslint-env jest */
'use strict';

const checkPreviewMode = require('./check-preview-mode');

test('checkPreviewMode', function () {
    expect(
        checkPreviewMode({
            'x-craft-live-preview': 'abc',
            'x-craft-preview': '123',
            'token': '456',
        })
    ).toStrictEqual({
        isLivePreview: 'abc',
        isPreview: 'abc',
        isShareLink: '456',
    });

    expect(checkPreviewMode({ 'x-craft-live-preview': 'abc' })).toStrictEqual({
        isLivePreview: 'abc',
        isPreview: 'abc',
        isShareLink: undefined,
    });

    expect(
        checkPreviewMode({ 'x-craft-preview': '123', 'token': '456' })
    ).toStrictEqual({
        isLivePreview: undefined,
        isPreview: '456',
        isShareLink: '456',
    });
});
