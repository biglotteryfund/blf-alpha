'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const router = express.Router();

const strandTitle = 'Using digital to change your business';

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand-1'), {
        title: strandTitle,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle }])
    });
});

router.get('/eligibility', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/strand-1-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

router.get('/eligibility/no', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/strand-1-no'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

module.exports = router;
