'use strict';
const appData = require('../../modules/appData');
const routeHelpers = require('../helpers/route-helpers');

const countRoutes = routeList => routeList.filter(route => route.live === true).length;

function init({ router }) {
    router.get('/pages', async (req, res, next) => {
        try {
            const canonicalRoutes = await routeHelpers.getCanonicalRoutes({ includeDraft: appData.isNotProduction });
            res.render('tools/pagelist', {
                canonicalRoutes,
                totalCanonicalRoutes: countRoutes(canonicalRoutes)
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
}

module.exports = {
    init
};
