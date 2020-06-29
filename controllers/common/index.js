'use strict';
const path = require('path');
const express = require('express');

const { injectListingContent } = require('../../common/inject-content');

function flexibleContentPage() {
    const router = express.Router();

    router.get('/', injectListingContent, function (req, res, next) {
        if (res.locals.content) {
            res.render(
                path.resolve(__dirname, './views/flexible-content-page')
            );
        } else {
            next();
        }
    });

    return router;
}

function renderFlexibleContentChild(req, res, entry) {
    if (entry.parent) {
        res.locals.breadcrumbs.push({
            label: entry.parent.title,
            url: entry.parent.linkUrl,
        });
    }

    res.render(path.resolve(__dirname, './views/flexible-content-page'), {
        breadcrumbs: res.locals.breadcrumbs.concat({ label: res.locals.title }),
        content: {
            flexibleContent: entry.flexibleContent,
        },
    });
}

module.exports = {
    flexibleContentPage,
    renderFlexibleContentChild,
};
