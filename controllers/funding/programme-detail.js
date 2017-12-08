const Raven = require('raven');
const contentApi = require('../../modules/content-api');
const { renderNotFound } = require('../http-errors');

function init({ router, config }) {
    router.get('/programmes/:slug', function(req, res) {
        contentApi
            .getFundingProgramme({
                locale: req.i18n.getLocale(),
                slug: req.params.slug
            })
            .then(entry => {
                if (entry.contentSections.length > 0) {
                    res.render(config.template, {
                        title: entry.title,
                        entry: entry
                    });
                } else {
                    throw new Error('NoContent');
                }
            })
            .catch(err => {
                Raven.captureException(err);
                renderNotFound(req, res);
            });
    });
}

module.exports = {
    init
};
