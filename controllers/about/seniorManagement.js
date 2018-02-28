const Raven = require('raven');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, sMaxAge(routeConfig.sMaxAge), (req, res, next) => {
        contentApi
            .getProfiles({
                locale: req.i18n.getLocale(),
                section: 'seniorManagementTeam'
            })
            .then(profiles => {
                const lang = req.i18n.__(routeConfig.lang);
                res.render(routeConfig.template, {
                    copy: lang,
                    title: lang.title,
                    profiles: profiles || []
                });
            })
            .catch(err => {
                Raven.captureException(err);
                next();
            });
    });
}

module.exports = {
    init
};
