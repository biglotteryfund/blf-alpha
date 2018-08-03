'use strict';
const path = require('path');
const sitemap = require('sitemap');
const express = require('express');

const { getBaseUrl } = require('../../modules/urls');
const navigationService = require('../../services/navigation-service');

const router = express.Router();

async function injectCanonicalRoutes(req, res, next) {
    try {
        res.locals.canonicalRoutes = await navigationService.getCanonicalRoutes({
            locale: req.i18n.getLocale()
        });
        next();
    } catch (error) {
        next(error);
    }
}

router.get('/sitemap', injectCanonicalRoutes, (req, res) => {
    /**
     * Prepare sitemap list
     * - If we have a langTitlePath then this is a custom page or top-level page (not from CMS)
     * - If we have a title then then is from the CMS, so use the value
     * - Filter out anything that we can't find a title for
     */
    const sitemapList = res.locals.canonicalRoutes
        .map(item => {
            item.title = item.langTitlePath ? req.i18n.__(item.langTitlePath) : item.title;
            return item;
        })
        .filter(item => item.title);

    res.render(path.resolve(__dirname, './views/sitemap'), {
        title: req.i18n.__('global.misc.sitemap'),
        sitemap: sitemapList
    });
});

router.get('/sitemap.xml', injectCanonicalRoutes, (req, res) => {
    const sitemapInstance = sitemap.createSitemap({
        hostname: getBaseUrl(req),
        urls: res.locals.canonicalRoutes.map(route => ({
            url: route.path
        }))
    });

    sitemapInstance.toXML(function(err, xml) {
        if (err) {
            return res.status(500).end();
        }
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    });
});

module.exports = router;
