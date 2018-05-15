'use strict';
const { injectCopy, injectProfiles } = require('../../middleware/inject-content');
const { shouldServe } = require('../../modules/pageLogic');

function serveProfiles({ router, routeConfig, profilesSection }) {
    if (shouldServe(routeConfig)) {
        router.get(routeConfig.path, injectCopy(routeConfig), injectProfiles(profilesSection), (req, res) => {
            const profiles = res.locals.profiles;
            if (profiles.length > 0) {
                res.render(routeConfig.template, { profiles });
            } else {
                throw new Error('NoProfiles');
            }
        });
    }
}

function init({ router, routeConfigs }) {
    serveProfiles({ router, routeConfig: routeConfigs.seniorManagement, profilesSection: 'seniorManagementTeam' });
    serveProfiles({ router, routeConfig: routeConfigs.board, profilesSection: 'boardMembers' });
}

module.exports = {
    init
};
