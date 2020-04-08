'use strict';

module.exports = function checkPreviewMode(queryParams) {
    function isLivePreview() {
        if (queryParams['x-craft-live-preview'] !== null && queryParams['token'] !== null)
            return queryParams['x-craft-live-preview'] && queryParams['token'];
        else
            return queryParams['x-craft-live-preview'] !== null ? queryParams['x-craft-live-preview'] : queryParams['token'];
    }

    function isShareLink() {
        if (queryParams['x-craft-live-preview'] !== null && queryParams['token'] !== null)
            return queryParams['x-craft-live-preview'] && queryParams['token'];
        else
            return queryParams['x-craft-live-preview'] !== null ? queryParams['x-craft-live-preview'] : queryParams['token'];
    }

    return {
        isPreview: isLivePreview() || isShareLink(),
        isLivePreview: isLivePreview(),
        isShareLink: isShareLink(),
    };
};
