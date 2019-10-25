'use strict';
const get = require('lodash/get');

module.exports = function(content) {
    let result = 'list';
    const childPageDisplay = get(content, 'childPageDisplay');

    if (content.children) {
        /**
         * Should show a grid of child images,
         * but do they all have images we can use?
         */
        const allHaveTrailImages = content.children.every(_ => _.trailImage);
        if (childPageDisplay === 'grid' && allHaveTrailImages) {
            result = 'grid';
        } else if (!childPageDisplay || childPageDisplay === 'none') {
            result = false;
        }
    }

    return result;
};
