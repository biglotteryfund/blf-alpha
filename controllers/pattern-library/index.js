'use strict';
const util = require('util');
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const { homepageHero } = require('../../modules/images');

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/index'), {
        title: 'Styleguide',
        description: 'Styleguide'
    });
});

router.get('/typography', (req, res) => {
    res.render(path.resolve(__dirname, './views/typography'), {
        title: 'Styleguide',
        description: 'Typography'
    });
});

router.get('/components', (req, res, next) => {
    const { component } = req.query;
    if (component) {
        // Check if the file is readable.
        const componentPath = path.resolve(__dirname, `../../views/components/${component}/examples.njk`);
        fs.access(componentPath, fs.constants.R_OK, err => {
            if (err) {
                next();
            } else {
                res.render(path.resolve(__dirname, './views/component-detail'), {
                    title: 'Styleguide',
                    description: 'Components: ' + component,
                    slug: component
                });
            }
        });
    } else {
        res.render(path.resolve(__dirname, './views/components'), {
            title: 'Styleguide',
            description: 'Components',
            superHeroImages: homepageHero
        });
    }
});

module.exports = router;
