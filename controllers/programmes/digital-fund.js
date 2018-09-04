'use strict';
const express = require('express');
const path = require('path');
const { injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectHeroImage('whizz-kidz'));

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-landing'), {
        heroImage: res.locals.heroImage,
        title: 'Digital Fund'
    });
});

router.get('/getting-started', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-getting-started'), {
        heroImage: res.locals.heroImage,
        title: 'Getting started'
    });
});

router.get('/strand-1', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1'), {
        heroImage: res.locals.heroImage,
        title: 'Strand 1'
    });
});

router.get('/strand-2', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2'), {
        heroImage: res.locals.heroImage,
        title: 'Strand 2'
    });
});

module.exports = router;
