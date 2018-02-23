'use strict';

const express = require('express');
const config = require('config');
const { sortBy } = require('lodash');
const { body, validationResult } = require('express-validator/check');
const xss = require('xss');
const moment = require('moment');

const router = express.Router();

const routerSetup = require('../setup');
const routeStatic = require('../utils/routeStatic');
const surveyService = require('../../services/surveys');
const contentApi = require('../../services/content-api');

const { heroImages } = require('../../modules/images');
const regions = require('../../config/content/regions.json');
const { noCache } = require('../../middleware/cached');

const homepageRoute = require('./homepage');
const searchRoute = require('./search');
const legacyPages = require('./legacyPages');

const blockedRobotRoutes = require('../../config/app/robots.json');

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
        let surveyToShow = false;

        // fetch all active surveys from the API so we can filter them
        contentApi
            .getSurveys({
                locale: req.i18n.getLocale()
            })
            .then(surveys => {
                // is there a path-specific survey here?
                surveyToShow = surveys.find(s => s.surveyPath === path);

                // if not, is there a site-wide survey?
                if (!surveyToShow) {
                    surveyToShow = surveys.find(s => s.global);
                }

                res.send({
                    status: surveyToShow ? 'success' : 'error',
                    survey: surveyToShow
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
                survey_id: surveyId,
                choice_id: req.body['choice'],
                path: req.body.path
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

    router.get('/robots.txt', noCache, (req, res) => {
        res.setHeader('Content-Type', 'text/plain');

        let buildBlocklist = path => `Disallow: ${path}\n`;

        // block all by default
        let pathsToBlock = ['/'];

        // only allow robots to crawl the live production domain
        if (req.get('host') === config.get('siteDomain')) {
            pathsToBlock = blockedRobotRoutes;
        }

        let text = pathsToBlock.reduce((acc, path) => acc + buildBlocklist(path), 'User-agent: *\n');
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
