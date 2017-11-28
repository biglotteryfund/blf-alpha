'use strict';

const Raven = require('raven');
const express = require('express');
const config = require('config');
const { get, sortBy } = require('lodash');
const rp = require('request-promise');
const ab = require('express-ab');
const { body, validationResult } = require('express-validator/check');
const xss = require('xss');
const moment = require('moment');

const router = express.Router();

const app = require('../../server');
const routeStatic = require('../utils/routeStatic');
const regions = require('../../config/content/regions.json');
const models = require('../../models/index');
const proxyLegacy = require('../../modules/proxy');
const getSecret = require('../../modules/get-secret');
const analytics = require('../../modules/analytics');
const contentApi = require('../../modules/content');
const cached = require('../../middleware/cached');
const { heroImages } = require('../../modules/images');

const legacyPages = require('./legacyPages');

const robots = require('../../config/app/robots.json');
// block everything on non-prod envs
if (app.get('env') !== 'production') {
    robots.push('/');
}

const newHomepage = [
    cached.noCache,
    (req, res) => {
        const serveHomepage = news => {
            const lang = req.i18n.__('toplevel.home');

            res.render('pages/toplevel/home', {
                title: lang.title,
                description: lang.description || false,
                copy: lang,
                news: news || [],
                heroImage: heroImages.homepageHero
            });
        };

        // get news articles
        contentApi
            .getPromotedNews(req.i18n.getLocale())
            .then(response => get(response, 'data', []))
            .then(data => data.map(item => item.attributes))
            .then(news => {
                serveHomepage(news);
            })
            .catch(() => {
                serveHomepage();
            });
    }
];

const oldHomepage = (req, res) => {
    return proxyLegacy.proxyLegacyPage(req, res);
};

module.exports = (pages, sectionPath, sectionId) => {
    /**
     * 1. Populate static pages
     */
    routeStatic.initRouting(pages, router, sectionPath, sectionId);

    if (config.get('abTests.enabled')) {
        const testHomepage = ab.test('blf-homepage-2017', {
            cookie: {
                name: config.get('cookies.abTest'),
                maxAge: 60 * 60 * 24 * 7 * 1000 // one week
            },
            id: config.get('abTests.tests.homepage.id') // google experiment ID
        });

        const percentageToSeeNewHomepage = config.get('abTests.tests.homepage.percentage');

        // variant 0/A: existing site (proxied)
        router.get('/', testHomepage(null, (100 - percentageToSeeNewHomepage) / 100), oldHomepage);

        // variant 1/B: new homepage
        router.get('/', testHomepage(null, percentageToSeeNewHomepage / 100), newHomepage);
    } else {
        router.get('/', newHomepage);
    }

    router.post('/', proxyLegacy.postToLegacyForm);

    // used for tests: override A/B cohorts
    router.get('/home', newHomepage);

    router.get('/legacy', (req, res) => {
        return proxyLegacy.proxyLegacyPage(req, res, null, '/');
    });

    legacyPages.init(router);

    // send form data to the (third party) email newsletter provider
    router.post(
        '/ebulletin',
        [
            body('firstName', 'Please provide your first name')
                .exists()
                .not()
                .isEmpty(),
            body('lastName', 'Please provide your last name')
                .exists()
                .not()
                .isEmpty(),
            body('email')
                .exists()
                .not()
                .isEmpty()
                .withMessage('Please provide your email address')
                .isEmail()
                .withMessage('Please provide a valid email address'),
            body('location', 'Please choose a country newsletter')
                .exists()
                .not()
                .isEmpty()
        ],
        (req, res) => {
            const errors = validationResult(req);
            // sanitise input
            for (let key in req.body) {
                req.body[key] = xss(req.body[key]);
            }

            if (!errors.isEmpty()) {
                req.flash('formErrors', errors.array());
                req.flash('formValues', req.body);
                // @TODO should this go to /home (eg. if they're in an A/B test for the old homepage)
                req.session.save(() => {
                    res.redirect('/#' + config.get('anchors.ebulletin'));
                });
            } else {
                let newsletterLocation = req.body.location;
                let locale = req.body.locale;
                let localePrefix = locale === 'cy' ? config.get('i18n.urlPrefix.cy') : '';

                // redirect errors back to the homepage
                let handleSignupError = errMsg => {
                    Raven.captureMessage(errMsg || 'Error with ebulletin');
                    req.flash('ebulletinStatus', 'error');
                    req.session.save(() => {
                        // @TODO build this URL more intelligently
                        return res.redirect(localePrefix + '/#' + config.get('anchors.ebulletin'));
                    });
                };

                let handleSignupSuccess = () => {
                    analytics.track('emailNewsletter', 'signup', newsletterLocation);
                    req.flash('ebulletinStatus', 'success');
                    req.session.save(() => {
                        // @TODO build this URL more intelligently
                        return res.redirect(localePrefix + '/#' + config.get('anchors.ebulletin'));
                    });
                };

                let dataToSend = {
                    email: req.body.email,
                    emailType: 'Html',
                    dataFields: [
                        {
                            key: 'FIRSTNAME',
                            value: req.body.firstName
                        },
                        {
                            key: 'LASTNAME',
                            value: req.body.lastName
                        },
                        {
                            key: newsletterLocation,
                            value: 'yes'
                        }
                    ]
                };

                // optional fields
                if (req.body['organisation']) {
                    dataToSend.dataFields.push({
                        key: 'ORGANISATION',
                        value: req.body.organisation
                    });
                }

                let addressBookId = 589755;
                let apiAddContactPath = `/address-books/${addressBookId}/contacts`;

                // send the valid form to the signup endpoint (external)
                rp({
                    uri: config.get('ebulletinApiEndpoint') + apiAddContactPath,
                    method: 'POST',
                    auth: {
                        user: getSecret('dotmailer.api.user'),
                        pass: getSecret('dotmailer.api.password'),
                        sendImmediately: true
                    },
                    json: true,
                    body: dataToSend,
                    resolveWithFullResponse: true
                })
                    .then(response => {
                        // signup succeeded
                        if (response.statusCode === 200) {
                            return handleSignupSuccess();
                        } else {
                            return handleSignupError(response.message);
                        }
                    })
                    .catch(error => {
                        return handleSignupError(error.message || error);
                    });
            }
        }
    );

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
        models.Survey.findAll({
            where: {
                active: true
            },
            include: [
                {
                    model: models.SurveyChoice,
                    as: 'choices',
                    required: true
                }
            ]
        })
            .then(surveys => {
                let returnData = {
                    status: 'success'
                };

                // optionally filter surveys
                if (path) {
                    returnData.survey = surveys.find(s => s.activePath === path);
                } else {
                    returnData.surveys = surveys;
                }

                res.send(returnData);
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
            // form was okay, let's store their submission

            // sanitise input
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

            // we could still fail at this point if the choice isn't valid for this ID
            // (SQL constraint error)
            models.SurveyResponse.create(responseData)
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

    return router;
};
