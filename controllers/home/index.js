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
                small: '/assets/images/home/superhero-shallow-small.jpg',
                medium: '/assets/images/home/superhero-shallow-medium.jpg',
                large: '/assets/images/home/superhero-shallow-large.jpg',
                default: '/assets/images/home/superhero-shallow-medium.jpg',
                caption: 'Superstars Club',
            },
        });
    } catch (error) {
        next(error);
    }
};
