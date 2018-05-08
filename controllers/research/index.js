'use strict';
const routeCommon = require('../common');

module.exports = (router, pages, sectionPath, sectionId) => {
    routeCommon.init({
        router,
        pages,
        sectionPath,
        sectionId
    });

    return router;
};
