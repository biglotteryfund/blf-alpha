'use strict';
const express = require('express');
const path = require('path');
const { find } = require('lodash');

const { injectCopy, injectHeroImage, injectOurPeople, setCommonLocals } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectCopy('ourPeople'), injectOurPeople, function(req, res, next) {
    const { title } = res.locals.copy;

    res.locals.sectionTitle = title;

    res.locals.ourPeopleLinks = res.locals.ourPeople.map(item => {
        return {
            label: item.title,
            slug: item.slug,
            href: item.linkUrl
        };
    });

    next();
});

router.get('/', injectHeroImage('mental-health-foundation', 'mental-health-foundation-new'), (req, res) => {
    res.render(path.resolve(__dirname, './views/our-people'));
});

router.get('/:slug', (req, res, next) => {
    const entry = find(res.locals.ourPeople, item => item.slug === req.params.slug);
    if (entry) {
        setCommonLocals({ res, entry });
        res.render(path.resolve(__dirname, './views/profiles'), { entry });
    } else {
        next();
    }
});

module.exports = router;
