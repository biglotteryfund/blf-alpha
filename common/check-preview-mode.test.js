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
        isLivePreview: true,
        isPreview: true,
        isShareLink: true,
    });

    expect(checkPreviewMode({ 'x-craft-live-preview': 'abc' })).toStrictEqual({
        isLivePreview: true,
        isPreview: true,
        isShareLink: false,
    });

    expect(
        checkPreviewMode({ 'x-craft-preview': '123', 'token': '456' })
    ).toStrictEqual({
        isLivePreview: false,
        isPreview: true,
        isShareLink: true,
    });
});
