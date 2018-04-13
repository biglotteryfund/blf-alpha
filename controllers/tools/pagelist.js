const { renderError } = require('../http-errors');
const appData = require('../../modules/appData');
const routeHelpers = require('../route-helpers');

function init({ router }) {
    router.get('/pages', async (req, res) => {
        try {
            const canonicalRoutes = await routeHelpers.getCanonicalRoutes({ includeDraft: appData.isNotProduction });
            const redirectRoutes = await routeHelpers.getCombinedRedirects({ includeDraft: appData.isNotProduction });
            const vanityRoutes = await routeHelpers.getVanityRedirects();

            const countRoutes = routeList => routeList.filter(route => route.live === true).length;

            const totals = {
                canonical: countRoutes(canonicalRoutes),
                redirects: countRoutes(redirectRoutes),
                vanity: countRoutes(vanityRoutes)
            };

            res.render('pages/tools/pagelist', {
                totals,
                canonicalRoutes,
                redirectRoutes,
                vanityRoutes
            });
        } catch (err) {
            renderError(err);
        }
    });

    return router;
}

module.exports = {
    init
};
