'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const globby = require('globby');
const capitalize = require('lodash/capitalize');

const router = express.Router();

router.use(function(req, res, next) {
    res.setHeader('X-Robots-Tag', 'noindex');
    res.locals.breadcrumbs = [{ label: 'Design patterns', url: req.baseUrl }];
    next();
});

router.get('/', function(req, res) {
    res.render(path.resolve(__dirname, './views/index'));
});

router.get('/styles', function(req, res) {
    const title = 'Styles';
    res.render(path.resolve(__dirname, './views/styles'), {
        title,
        breadcrumbs: res.locals.breadcrumbs.concat({
            label: title
        })
    });
});

router.get('/components', async (req, res, next) => {
    if (req.query.component) {
        fs.access(
            path.resolve(
                __dirname,
                `../../views/components/${req.query.component}/examples.njk`
            ),
            fs.constants.R_OK,
            function(err) {
                if (err) {
                    next();
                } else {
                    const title = capitalize(
                        req.query.component.replace('-', ' ')
                    );
                    const breadcrumbs = res.locals.breadcrumbs.concat([
                        {
                            label: 'Components',
                            url: `${req.baseUrl}${req.path}`
                        },
                        { label: title }
                    ]);

                    res.render(
                        path.resolve(__dirname, './views/component-detail'),
                        {
                            title,
                            breadcrumbs,
                            slug: req.query.component
                        }
                    );
                }
            }
        );
    } else {
        try {
            const matches = await globby(
                path.resolve(__dirname, '../../views/components') +
                    '/**/examples.njk'
            );

            if (matches.length > 0) {
                const title = 'Components';
                const breadcrumbs = res.locals.breadcrumbs.concat({
                    label: title
                });

                const componentSlugs = matches
                    .map(match => path.basename(path.dirname(match)))
                    .sort();

                res.render(path.resolve(__dirname, './views/components'), {
                    title,
                    breadcrumbs,
                    componentSlugs: componentSlugs
                });
            } else {
                next(new Error('No components found'));
            }
        } catch (error) {
            next(error);
        }
    }
});

module.exports = router;
