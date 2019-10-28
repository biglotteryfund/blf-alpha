'use strict';

module.exports = function checkPreviewMode(queryParams) {
    function isLivePreview() {
        return queryParams['x-craft-live-preview'] && queryParams['token'];
    }

    function isShareLink() {
        return queryParams['x-craft-preview'] && queryParams['token'];
    }

    return {
        isPreview: isLivePreview() || isShareLink(),
        isLivePreview: isLivePreview(),
        isShareLink: isShareLink()
    };
};
