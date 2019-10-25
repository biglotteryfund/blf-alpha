'use strict';
const express = require('express');
const path = require('path');
const { find } = require('lodash');

const {
    injectCopy,
    injectHeroImage,
    setCommonLocals
} = require('../../common/inject-content');
const contentApi = require('../../common/content-api');

const router = express.Router();

function mapLinks(people) {
    return people.map(item => {
        return {
            label: item.title,
            slug: item.slug,
            href: item.linkUrl
        };
    });
}

router.use(injectCopy('ourPeople'), async function(req, res, next) {
    const { title } = res.locals.copy;
    res.locals.sectionTitle = title;
    next();
});

router.get('/', injectHeroImage('mental-health-foundation-new'), async function(
    req,
    res,
    next
) {
    try {
        const people = await contentApi.getOurPeople({
            locale: req.i18n.getLocale(),
            requestParams: req.query
        });

        res.render(path.resolve(__dirname, './views/our-people'), {
            ourPeopleLinks: mapLinks(people)
        });

        next();
    } catch (error) {
        next(error);
    }
});

router.get('/:slug', async function(req, res, next) {
    try {
        const people = await contentApi.getOurPeople({
            locale: req.i18n.getLocale(),
            requestParams: req.query
        });

        const entry = find(people, item => item.slug === req.params.slug);

        if (entry) {
            setCommonLocals({ res, entry });

            res.render(path.resolve(__dirname, './views/profiles'), {
                entry: entry,
                ourPeopleLinks: mapLinks(people)
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
