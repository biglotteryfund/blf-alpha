'use strict';
const get = require('lodash/get');

module.exports = function getLayoutMode(content) {
    let childrenLayoutMode = 'list';
    const childPageDisplay = get(content, 'childPageDisplay');

    // This page should show a grid of child images
    // but do they all have images we can use?
    if (content.children) {
        const missingTrailImages = content.children.some(
            page => !page.trailImage
        );
        if (childPageDisplay === 'grid' && !missingTrailImages) {
            childrenLayoutMode = 'grid';
        } else if (!childPageDisplay || childPageDisplay === 'none') {
            childrenLayoutMode = false;
        }
    }
    return childrenLayoutMode;
};
