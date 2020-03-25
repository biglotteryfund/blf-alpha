'use strict';
const express = require('express');
const path = require('path');

const {
    injectHeroImage,
    setCommonLocals,
} = require('../../common/inject-content');
const contentApi = require('../../common/content-api');

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

router.get('/', injectHeroImage('mental-health-foundation-new'), function (
    req,
    res
) {
    res.render(path.resolve(__dirname, './views/our-people'));
});

router.get('/:slug', async function (req, res, next) {
    const entry = res.locals.people.find(function (item) {
        return item.slug === req.params.slug;
    });

    if (entry) {
        setCommonLocals(req, res, entry);

        res.render(path.resolve(__dirname, './views/profiles'), {
            entry: entry,
        });
    } else {
        next();
    }
});

module.exports = router;
