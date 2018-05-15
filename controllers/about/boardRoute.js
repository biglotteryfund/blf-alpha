'use strict';
const Raven = require('raven');
const contentApi = require('../../services/content-api');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res, next) => {
        const locale = req.i18n.getLocale();
        const copy = req.i18n.__('about.ourPeople');
        contentApi
            .getProfiles({
                locale: locale,
                section: 'boardMembers'
            })
            .then(profiles => {
                if (profiles.length > 0) {
                    res.render(routeConfig.template, {
                        title: copy.board.title,
                        copy: copy.board,
                        navigation: copy.navigation,
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
