const { find } = require('lodash');
const { sMaxAge } = require('../../middleware/cached');
const injectHeroImage = require('../../middleware/inject-hero');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, sMaxAge(routeConfig.sMaxAge), injectHeroImage(routeConfig), (req, res) => {
        function renderLandingPage(programmes) {
            const lang = req.i18n.__(routeConfig.lang);
            res.render(routeConfig.template, {
                copy: lang,
                title: lang.title,
                latestProgrammes: programmes || []
            });
        }

        contentApi
            .getFundingProgrammes({
                locale: req.i18n.getLocale()
            })
            .then(programmes => {
                /**
                 * "Latest" programmes
                 * @todo Hardcoded for now but we may want to fetch these dynamically.
                 */
                const findBySlug = slug => find(programmes, p => p.urlPath === `funding/programmes/${slug}`);
                const latestProgrammes = [
                    findBySlug('reaching-communities-england'),
                    findBySlug('national-lottery-awards-for-all-england'),
                    findBySlug('empowering-young-people')
                ];

                renderLandingPage(latestProgrammes);
            })
            .catch(() => {
                renderLandingPage();
            });
    });
}

module.exports = {
    init
};
