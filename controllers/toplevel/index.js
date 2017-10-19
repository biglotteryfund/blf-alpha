'use strict';
const express = require('express');
const config = require('config');
const router = express.Router();
const rp = require('request-promise');
const ab = require('express-ab');
const { sortBy } = require('lodash');
const xss = require('xss');

const app = require('../../server');
const routeStatic = require('../utils/routeStatic');
const regions = require('../../config/content/regions.json');
const models = require('../../models/index');
const proxyLegacy = require('../../modules/proxy');
const utilities = require('../../modules/utilities');
const secrets = require('../../modules/secrets');
const analytics = require('../../modules/analytics');

const robots = require('../../config/app/robots.json');
// block everything on non-prod envs
if (app.get('env') !== 'production') {
    robots.push('/');
}

const newHomepage = (req, res) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };

    const serveHomepage = news => {
        const lang = req.i18n.__('toplevel.home');

        const heroImageDefault = utilities.createHeroImage({
            small: 'images/home/home-hero-4-small.jpg',
            medium: 'images/home/home-hero-4-medium.jpg',
            large: 'images/home/home-hero-4-large.jpg',
            default: 'images/home/home-hero-4-medium.jpg',
            caption: 'Somewhereto, Grant £7m'
        });

        const heroImageCandidates = [
            utilities.createHeroImage({
                small: 'images/home/home-hero-1-small.jpg',
                medium: 'images/home/home-hero-1-medium.jpg',
                large: 'images/home/home-hero-1-large.jpg',
                default: 'images/home/home-hero-1-medium.jpg',
                caption: 'Cycling for All in Bolsover, Grant £9,358 *'
            }),
            utilities.createHeroImage({
                small: 'images/home/home-hero-2-small.jpg',
                medium: 'images/home/home-hero-2-medium.jpg',
                large: 'images/home/home-hero-2-large.jpg',
                default: 'images/home/home-hero-2-medium.jpg',
                caption: 'Stepping Stones Programme, Grant £405,270'
            }),
            utilities.createHeroImage({
                small: 'images/home/home-hero-3-small.jpg',
                medium: 'images/home/home-hero-3-medium.jpg',
                large: 'images/home/home-hero-3-large.jpg',
                default: 'images/home/home-hero-3-medium.jpg',
                caption: 'Cloughmills Community Action, Grant £4,975*'
            }),
            heroImageDefault
        ];

        res.render('pages/toplevel/home', {
            title: lang.title,
            description: lang.description || false,
            copy: lang,
            news: news || [],
            heroImageDefault: heroImageDefault,
            heroImageCandidates: heroImageCandidates
        });
    };

    // get news articles
    try {
        models.News
            .findAll({
                limit: 3,
                order: [['updatedAt', 'DESC']]
            })
            .then(serveHomepage);
    } catch (e) {
        console.log('Could not find news posts');
        serveHomepage();
    }
};

const oldHomepage = (req, res) => {
    return proxyLegacy.proxyLegacyPage(req, res);
};

// serve the legacy site funding finder (via proxy)
router.get('/funding/funding-finder', (req, res) => {
    // rewrite HTML to remove invalid funding programs
    return proxyLegacy.proxyLegacyPage(req, res, dom => {
        // should we filter out programs under 10k?
        if (req.query.over && req.query.over === '10k') {
            // get the list of program elements
            let programs = dom.window.document.querySelectorAll('article.programmeList');
            if (programs.length > 0) {
                [].forEach.call(programs, p => {
                    // find the key facts block (which contains the funding size)
                    let keyFacts = p.querySelectorAll('.taxonomy-keyFacts dt');
                    if (keyFacts.length > 0) {
                        [].forEach.call(keyFacts, k => {
                            // find the node with the funding size info (if it exists)
                            let textValue = k.textContent.toLowerCase();
                            // english/welsh version
                            if (['funding size:', 'maint yr ariannu:'].indexOf(textValue) !== -1) {
                                // convert string into number
                                let programUpperLimit = utilities.parseValueFromString(k.nextSibling.textContent);
                                // remove the element if it's below our threshold
                                if (programUpperLimit <= 10000) {
                                    p.parentNode.removeChild(p);
                                }
                            }
                        });
                    }
                });
            }
        }
        return dom;
    });
});

// allow form submissions on funding finder to pass through to proxy
router.post('/funding/funding-finder', proxyLegacy.postToLegacyForm);

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

    // send form data to the (third party) email newsletter provider
    router.post('/ebulletin', (req, res) => {
        req.checkBody('firstName', 'Please provide your first name').notEmpty();
        req.checkBody('lastName', 'Please provide your last name').notEmpty();
        req.checkBody('email', 'Please provide your email address').notEmpty();
        req.checkBody('location', 'Please choose a country newsletter').notEmpty();

        req.getValidationResult().then(result => {
            // sanitise input
            for (let key in req.body) {
                req.body[key] = xss(req.body[key]);
            }

            if (!result.isEmpty()) {
                req.flash('formErrors', result.array());
                req.flash('formValues', req.body);
                req.session.save(() => {
                    res.redirect('/#' + config.get('anchors.ebulletin'));
                });
            } else {
                let newsletterLocation = req.body['location'];
                let locale = req.body.locale;
                let localePrefix = locale === 'cy' ? config.get('i18n.urlPrefix.cy') : '';

                // redirect errors back to the homepage
                let handleSignupError = () => {
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
                            value: req.body['firstName']
                        },
                        {
                            key: 'LASTNAME',
                            value: req.body['lastName']
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
                        value: req.body['organisation']
                    });
                }

                let addressBookId = 589755;
                let apiAddContactPath = `/address-books/${addressBookId}/contacts`;

                // send the valid form to the signup endpoint (external)
                rp({
                    uri: config.get('ebulletinApiEndpoint') + apiAddContactPath,
                    method: 'POST',
                    auth: {
                        user: secrets['dotmailer.api.user'],
                        pass: secrets['dotmailer.api.password'],
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
                            console.log('Got an error with ebulletin', response.message);
                            return handleSignupError();
                        }
                    })
                    .catch(error => {
                        // signup failed
                        console.log('Error signing up to ebulletin', error.message || error);
                        return handleSignupError();
                    });
            }
        });
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
        let duration = 6 * 30 * 24 * 60 * 60; // 6 months
        let cookieName = config.get('cookies.contrast');
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

    router.get('/styleguide', (req, res) => {
        res.render('pages/toplevel/styleguide', {
            title: 'Styleguide',
            description: 'Styleguide'
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
