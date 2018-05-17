'use strict';
const { injectFlexibleContent } = require('../../middleware/inject-content');

function init({ router, routeConfig }) {
    router.get(routeConfig.path, injectFlexibleContent, (req, res) => {
        const { entry } = res.locals;
        res.render(routeConfig.template, {
            title: entry.title,
            heroImage: entry.hero,
            socialImage: entry.hero
        });
    });
}

module.exports = {
    init
};
