'use strict';
const express = require('express');
const path = require('path');
const { concat } = require('lodash');
const { injectBreadcrumbs } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectBreadcrumbs, (req, res, next) => {
    res.locals.isBilingual = false;
    res.locals.heroImage = {
        small: '/assets/images/hero/blank-small.jpg',
        medium: '/assets/images/hero/blank-medium.jpg',
        large: '/assets/images/hero/blank-large.jpg',
        default: '/assets/images/hero/blank-medium.jpg'
    };

    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, [
        {
            label: req.i18n.__('funding.programmes.title'),
            url: '/funding/programmes'
        },
        {
            label: 'Digital Funding',
            url: req.baseUrl
        }
    ]);
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/landing'), {
        title: 'Digital Funding'
    });
});

router.get('/eligibility', (req, res) => {
    const title = 'Full eligibility criteria';
    res.render(path.resolve(__dirname, './views/full-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
    });
});

router.use('/assistance', require('./assistance'));
router.use('/strand-1', require('./strand-1'));
router.use('/strand-2', require('./strand-2'));

module.exports = router;
