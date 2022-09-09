'use strict';
const path = require('path');

const { ContentApiClient } = require('../../common/content-api');
const ContentApi = new ContentApiClient();

module.exports = async function (req, res, next) {
    try {
        const entry = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getHomepage(req.i18n.getLocale(), req.query);

        res.render(path.resolve(__dirname, './views/home'), {
            content: entry.content,
            featuredLinks: entry.featuredLinks,
            promotedUpdates: entry.promotedUpdates,
            heroImage: {
                small: '/assets/images/home/blackout_hero_small.png',
                medium: '/assets/images/home/blackout_hero_medium.png',
                large: '/assets/images/home/blackout_hero_large.png',
                default: '/assets/images/home/blackout_hero_medium.png',
                //caption: 'Superstars Club',
            },
        });
    } catch (error) {
        next(error);
    }
};

// This comment exists only to cause a code change.
