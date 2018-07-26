'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const globby = require('globby');

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/index'));
});

router.get('/styles', (req, res) => {
    res.render(path.resolve(__dirname, './views/styles'), {
        title: 'Styles'
    });
});

router.get('/components', async (req, res, next) => {
    const { component } = req.query;
    if (component) {
        // Check if the file is readable.
        const componentPath = path.resolve(__dirname, `../../views/components/${component}/examples.njk`);
        fs.access(componentPath, fs.constants.R_OK, err => {
            if (err) {
                next();
            } else {
                res.render(path.resolve(__dirname, './views/component-detail'), {
                    title: 'Components: ' + component,
                    slug: component
                });
            }
        });
    } else {
        try {
            const matches = await globby(path.resolve(__dirname, '../../views/components') + '/**/examples.njk');
            if (matches.length > 0) {
                const componentSlugs = matches.map(match => path.basename(path.dirname(match)));
                res.render(path.resolve(__dirname, './views/components'), {
                    title: 'Components',
                    componentSlugs: componentSlugs.sort()
                });
            } else {
                next(new Error('No components fount'));
            }
        } catch (error) {
            next(error);
        }
    }
});

module.exports = router;
