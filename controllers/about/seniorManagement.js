const Raven = require('raven');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, sMaxAge(routeConfig.sMaxAge), (req, res, next) => {
        const locale = req.i18n.getLocale();
        const copy = req.i18n.__(routeConfig.lang);
        contentApi
            .getProfiles({
                locale: locale,
                section: 'seniorManagementTeam'
            })
            .then(profiles => {
                if (profiles.length > 0) {
                    res.render(routeConfig.template, {
                        copy: copy,
                        title: copy.title,
                        profiles: profiles
                    });
                } else {
                    throw new Error('NoProfiles');
                }
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
