const { find } = require('lodash');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res) => {
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
                    findBySlug('helping-working-families'),
                    findBySlug('empowering-young-people'),
                    findBySlug('national-lottery-awards-for-all-england')
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
