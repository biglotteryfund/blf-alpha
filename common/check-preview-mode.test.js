/* eslint-env jest */
'use strict';

const preview = require('./check-preview-mode');


test('preview', function () {
    expect(preview({'x-craft-live-preview' : 'abc', 'x-craft-preview': '123', 'token': '456'})).toStrictEqual({isLivePreview: "abc", isPreview: "abc", isShareLink: "456"});
    expect(preview({'x-craft-live-preview' : 'abc'})).toStrictEqual({isLivePreview: "abc", isPreview: "abc", isShareLink: undefined});
    expect(preview({'x-craft-preview': '123', 'token': '456'})).toStrictEqual({isLivePreview: undefined, isPreview: "456", isShareLink: "456"});
});
