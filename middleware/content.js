'use strict';

const contentApi = require('../services/content-api');
const { renderNotFoundWithError } = require('../controllers/http-errors');

function injectContent(sectionId) {
    return function(req, res, next) {
        contentApi
            .getListingPage({
                locale: req.i18n.getLocale(),
                path: contentApi.getCmsPath(sectionId, req.path)
            })
            .then(content => {
                res.locals.content = content;
                next();
            })
            .catch(err => {
                renderNotFoundWithError(err, req, res);
            });
    };
}

module.exports = {
    injectContent
};
