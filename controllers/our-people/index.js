'use strict';
const express = require('express');
const path = require('path');
const { find } = require('lodash');

const { injectCopy, injectHeroImage, injectOurPeople, setCommonLocals } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectCopy('ourPeople'), injectOurPeople, function(req, res, next) {
    const { title, legacyNavigation } = res.locals.copy;

    res.locals.sectionTitle = title;

    const links = res.locals.ourPeople.map(item => {
        return {
            label: item.title,
            slug: item.slug,
            href: item.linkUrl
        };
    });

    // Merge items with legacy navigation to allow gradual migration
    res.locals.ourPeopleLinks = legacyNavigation.map(legacy => {
        const match = find(links, link => link.slug.indexOf(legacy.match) !== -1);
        return match ? match : legacy;
    });

    next();
});

router.get('/', injectHeroImage('mental-health-foundation'), (req, res) => {
    res.render(path.resolve(__dirname, './views/our-people'));
});

router.get('/:slug', injectOurPeople, (req, res, next) => {
    const entry = find(res.locals.ourPeople, item => item.slug === req.params.slug);
    if (entry) {
        setCommonLocals({ res, entry });
        res.render(path.resolve(__dirname, './views/profiles'), { entry });
    } else {
        next();
    }
});

module.exports = router;
