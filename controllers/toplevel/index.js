'use strict';

const express = require('express');
const config = require('config');
const { sortBy } = require('lodash');
const { body, validationResult } = require('express-validator/check');
const xss = require('xss');
const moment = require('moment');

const router = express.Router();

const appData = require('../../modules/appData');

const routerSetup = require('../setup');
const routeStatic = require('../utils/routeStatic');
const surveyService = require('../../services/surveys');

const { heroImages } = require('../../modules/images');
const regions = require('../../config/content/regions.json');

const homepageRoute = require('./homepage');
const searchRoute = require('./search');
const legacyPages = require('./legacyPages');

const robots = require('../../config/app/robots.json');
// block everything on non-prod envs
if (appData.isNotProduction) {
    robots.push('/');
}

module.exports = (pages, sectionPath, sectionId) => {
    routerSetup({
        router,
        pages,
        sectionId
    });

    /**
     * Homepage
     */
    homepageRoute.init({
        router: router,
        routeConfig: pages.home
    });

    /**
     * Legacy proxied pages
     */
    legacyPages.init({
        router: router
    });

    /**
     * Search
     */
    searchRoute.init({
        router: router,
        routeConfig: pages.search
    });

    // data page
    router.get(pages.data.path, (req, res) => {
        let grants = sortBy(regions, 'name');
        res.render('pages/toplevel/data', {
            grants: grants,
            copy: req.i18n.__(pages.data.lang)
        });
    });

    // handle contrast shifter
    router.get('/contrast/:mode', (req, res) => {
        res.cacheControl = { maxAge: 1 };

        let cookieName = config.get('cookies.contrast');
        let duration = moment.duration(6, 'months').asMilliseconds();
        let redirectUrl = req.query.url || '/';
        if (req.params.mode === 'high') {
            res.cookie(cookieName, req.params.mode, {
                maxAge: duration,
                httpOnly: false
            });
        } else {
            res.clearCookie(cookieName);
        }
        res.redirect(redirectUrl);
    });

    // retrieve list of surveys
    router.get('/surveys', (req, res) => {
        res.cacheControl = { maxAge: 60 * 10 }; // 10 mins
        let path = req.query.path;

        if (path) {
            // normalise URLs (eg. treat a Welsh URL the same as default)
            const CYMRU_URL = /\/welsh(\/|$)/;
            path = path.replace(CYMRU_URL, '/');
        }

        // get the survey from the database
        surveyService
            .findActiveWithChoices({
                filterByPath: path
            })
            .then(surveys => {
                res.send({
                    status: 'success',
                    surveys: surveys
                });
            })
            .catch(() => {
                res.send({
                    status: 'error',
                    message: 'Error querying database'
                });
            });
    });

    const surveyValidations = [
        body('choice')
            .exists()
            .not()
            .isEmpty()
            .isInt()
            .withMessage('Please supply a valid choice')
    ];

    // store survey responses
    router.post('/survey/:id', surveyValidations, (req, res) => {
        let surveyId = req.params.id;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.status(400);
            res.send({
                status: 'error',
                err: 'Please supply all fields'
            });
        } else {
            for (let key in req.body) {
                req.body[key] = xss(req.body[key]);
            }

            let responseData = {
                surveyChoiceId: req.body['choice']
            };

            // add a message (if we got one)
            if (req.body['message']) {
                responseData.message = req.body['message'];
            }

            // include any additional survey data
            if (req.body['metadata']) {
                responseData.metadata = req.body['metadata'];
            }

            /**
             * Form was okay, let's store their submission,
             * we could still fail at this point if the choice isn't valid for this ID
             * (SQL constraint error)
             */
            surveyService
                .createResponse(responseData)
                .then(data => {
                    res.send({
                        status: 'success',
                        surveyId: surveyId,
                        data: data
                    });
                })
                .catch(err => {
                    // SQL error with data
                    res.status(400);
                    res.send({
                        status: 'error',
                        err: err
                    });
                });
        }
    });

    router.get('/styleguide', (req, res) => {
        res.render('pages/toplevel/styleguide', {
            title: 'Styleguide',
            description: 'Styleguide',
            superHeroImages: heroImages.homepageHero
        });
    });

    router.get('/robots.txt', (req, res) => {
        res.setHeader('Content-Type', 'text/plain');
        let text = 'User-agent: *\n';
        robots.forEach(r => {
            text += `Disallow: ${r}\n`;
        });
        res.send(text);
    });

    /**
     * Populate static pages
     */
    routeStatic.init({
        router: router,
        pages: pages,
        sectionPath: sectionPath,
        sectionId: sectionId
    });

    return router;
};
