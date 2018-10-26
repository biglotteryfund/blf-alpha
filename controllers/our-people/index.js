'use strict';
const express = require('express');
const path = require('path');
const { find } = require('lodash');

const { injectCopy, injectHeroImage, injectOurPeople, setCommonLocals } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectCopy('ourPeople'), injectOurPeople, function(req, res, next) {
    res.locals.sectionTitle = res.locals.copy.title;
    next();
});

router.get('/', injectHeroImage('mental-health-foundation'), (req, res) => {
    const links = res.locals.ourPeople.map(item => {
        return {
            href: item.linkUrl,
            label: item.title
        };
    });

    res.render(path.resolve(__dirname, './views/our-people'), { links });
});

router.get('/:slug', injectOurPeople, (req, res) => {
    const entry = find(res.locals.ourPeople, item => item.slug === req.params.slug);
    if (entry) {
        setCommonLocals({ res, entry });
        res.render(path.resolve(__dirname, './views/profiles'), { entry });
    }
});

module.exports = router;
