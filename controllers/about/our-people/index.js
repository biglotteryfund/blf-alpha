'use strict';
const express = require('express');
const path = require('path');

const { injectHeroImage } = require('../../../common/inject-content');
const contentApi = require('../../../common/content-api');

const { flexibleContentPage } = require('../../common');

const router = express.Router();

router.use(async function (req, res, next) {
    try {
        const people = await contentApi.getOurPeople(
            req.i18n.getLocale(),
            req.query
        );

        res.locals.people = people;
        res.locals.sectionTitle = req.i18n.__('ourPeople.title');
        res.locals.ourPeopleLinks = people.map((item) => {
            return {
                label: item.title,
                slug: item.slug,
                href: item.linkUrl,
            };
        });

        next();
    } catch (error) {
        next(error);
    }
});

router.use(function (req, res, next) {
    res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
        label: req.i18n.__('ourPeople.title'),
        url: req.baseUrl,
    });
    next();
});

router.get('/', injectHeroImage('mental-health-foundation-new'), function (
    req,
    res
) {
    res.render(path.resolve(__dirname, './views/our-people'));
});

router.use(
    '/:slug',
    (req, res, next) => {
        res.locals.showSiblings = true;
        next();
    },
    flexibleContentPage()
);

module.exports = router;
