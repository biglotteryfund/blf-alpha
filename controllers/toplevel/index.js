'use strict';
const config = require('config');
const { body, validationResult } = require('express-validator/check');
const moment = require('moment');
const Raven = require('raven');

const surveyService = require('../../services/surveys');
const contentApi = require('../../services/content-api');

const { homepageHero } = require('../../modules/images');
const { purifyUserInput } = require('../../modules/validators');

const dataRoute = require('./data');
const feedbackRoute = require('./feedback');
const homepageRoute = require('./homepage');
const robotRoutes = require('./robots');
const searchRoute = require('./search');

module.exports = ({ router, pages }) => {
    /**
     * Robots / Sitemap
     */
    robotRoutes.init({
        router
    });

    /**
     * Homepage
     */
    homepageRoute.init({
        router: router,
        routeConfig: pages.home
    });

    /**
     * Search
     */
    searchRoute.init({
        router: router,
        routeConfig: pages.search
    });

    /**
     * Data
     */
    dataRoute.init({
        router: router,
        routeConfig: pages.data
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

    router.get('/prompts', (req, res) => {
        if (appData.isProduction) {
            res.json({
                prompt: null
            });
        } else {
            res.json({
                prompt: {
                    id: 'treejack',
                    weight: 0.2,
                    message: 'We are working on improving the website.',
                    link: {
                        href: 'https://example.com/',
                        label: 'Can you spare a few minutes to take a survey?'
                    }
                }
            });
        }
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
            })
            .catch(err => {
                Raven.captureMessage('Error retrieving surveys', {
                    extra: err
                });
                res.send({
                    status: 'error'
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
                req.body[key] = purifyUserInput(req.body[key]);
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
                responseData.metadata = JSON.parse(req.body['metadata']);
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

    /**
     * Feedback
     */
    feedbackRoute.init({ router });

    router.get('/styleguide', (req, res) => {

        const demoStats = [
            {
                value: '42',
                title: 'The meaning of life, the universe, and everything',
                prefix: '',
                suffix: '',
                showNumberBeforeTitle: true
            },
            {
                value: '9m',
                title: 'in Beijing',
                prefix: 'There are',
                suffix: 'bicycles',
                showNumberBeforeTitle: true
            },
            {
                value: '500 miles',
                title: 'I would walk',
                prefix: '',
                suffix: '',
                showNumberBeforeTitle: false
            }
        ];

        res.render('pages/toplevel/styleguide', {
            title: 'Styleguide',
            description: 'Styleguide',
            superHeroImages: homepageHero,
            demoStats: demoStats
        });
    });

    return router;
};
