'use strict';
const fs = require('fs');
const path = require('path');
const { capitalize, concat } = require('lodash');
const express = require('express');
const router = express.Router();
const globby = require('globby');

function buildBreadcrumbs(req, trail = []) {
    const core = [
        {
            label: 'Design system',
            url: req.baseUrl
        }
    ];

    return concat(core, trail);
}

router.get('/', (req, res) => {
    const breadcrumbs = buildBreadcrumbs(req);
    res.render(path.resolve(__dirname, './views/index'), { breadcrumbs });
});

router.get('/styles', (req, res) => {
    const title = 'Styles';
    const breadcrumbs = buildBreadcrumbs(req, [
        {
            label: title
        }
    ]);

    res.render(path.resolve(__dirname, './views/styles'), {
        title,
        breadcrumbs
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
                const title = capitalize(component.replace('-', ' '));
                const breadcrumbs = buildBreadcrumbs(req, [
                    {
                        label: 'Components',
                        url: req.baseUrl + req.path
                    },
                    {
                        label: title
                    }
                ]);

                res.render(path.resolve(__dirname, './views/component-detail'), {
                    title,
                    breadcrumbs,
                    slug: component
                });
            }
        });
    } else {
        try {
            const matches = await globby(path.resolve(__dirname, '../../views/components') + '/**/examples.njk');
            if (matches.length > 0) {
                const title = 'Components';
                const breadcrumbs = buildBreadcrumbs(req, [
                    {
                        label: title
                    }
                ]);
                const componentSlugs = matches.map(match => path.basename(path.dirname(match))).sort();
                res.render(path.resolve(__dirname, './views/components'), {
                    title,
                    breadcrumbs,
                    componentSlugs: componentSlugs
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
