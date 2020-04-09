'use strict';
const has = require('lodash/has');

module.exports = function checkPreviewMode(queryParams) {
    function isLivePreview() {
        return has(queryParams, 'x-craft-live-preview');
    }

    function isShareLink() {
        return has(queryParams, 'x-craft-preview') && has(queryParams, 'token');
    }

    return {
        isPreview: isLivePreview() || isShareLink(),
        isLivePreview: isLivePreview(),
        isShareLink: isShareLink(),
    };
};
