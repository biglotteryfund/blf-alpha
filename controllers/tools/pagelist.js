'use strict';
const { getCanonicalRoutes } = require('../../modules/route-helpers');

function init({ router }) {
    router.get('/pages', async (req, res, next) => {
        try {
            const canonicalRoutes = await getCanonicalRoutes();
            res.render('tools/pagelist', {
                canonicalRoutes
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
