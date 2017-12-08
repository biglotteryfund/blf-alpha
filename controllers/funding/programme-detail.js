const { get } = require('lodash');
const contentApi = require('../../modules/content-api');
const { renderNotFound } = require('../http-errors');

function mapContentSections(entry) {
    const contentSectionsRaw = get(entry, 'contentSections', []);
    return contentSectionsRaw.map((section, idx) => {
        return {
            id: `section-${idx}`,
            title: section.title,
            content: section.body,
            active: idx === 0
        };
    });
}

function init({ router, config }) {
    router.get('/programmes/:slug', function(req, res) {
        contentApi
            .getFundingProgramme({
                locale: req.i18n.getLocale(),
                slug: req.params.slug
            })
            .then(entry => {
                res.render(config.template, {
                    title: entry.title,
                    contentSections: mapContentSections(entry)
                });
            })
            .catch(err => {
                console.log(err);
                renderNotFound(req, res);
            });
    });
}

module.exports = {
    init,
    mapContentSections
};
