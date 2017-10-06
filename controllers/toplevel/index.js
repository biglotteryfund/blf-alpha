'use strict';
const express = require('express');
const config = require('config');
const router = express.Router();
const rp = require('request-promise');
const ab = require('express-ab');
const { has, sortBy } = require('lodash');
const xss = require('xss');

const app = require('../../server');
const routeStatic = require('../utils/routeStatic');
const regions = require('../../config/content/regions.json');
const models = require('../../models/index');
const proxyLegacy = require('../../modules/proxy');
const assets = require('../../modules/assets');

const robots = require('../../config/app/robots.json');
// block everything on non-prod envs
if (app.get('env') !== 'production') {
    robots.push('/');
}

function createHeroImage(opts) {
    if (!['small', 'medium', 'large'].every(x => has(opts, x))) {
        throw new Error('Must pass a small, medium, and large image');
    }

    if (!has(opts, 'default')) {
        throw new Error('Must define a default image with opts.default');
    }

    return {
        small: assets.getCachebustedPath(opts.small),
        medium: assets.getCachebustedPath(opts.medium),
        large: assets.getCachebustedPath(opts.large),
        default: assets.getCachebustedPath(opts.default),
        caption: opts.caption || ''
    };
}

const newHomepage = (req, res) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };

    const serveHomepage = news => {
        const lang = req.i18n.__('toplevel.home');

        const heroImageDefault = createHeroImage({
            small: 'images/home/home-hero-3-small.jpg',
            medium: 'images/home/home-hero-3-medium.jpg',
            large: 'images/home/home-hero-3-large.jpg',
            default: 'images/home/home-hero-3-medium.jpg',
            caption: 'Cloughmills Community Action, Grant £4,975*'
        });

        const heroImageCandidates = [
            createHeroImage({
                small: 'images/home/home-hero-1-small.jpg',
                medium: 'images/home/home-hero-1-medium.jpg',
                large: 'images/home/home-hero-1-large.jpg',
                default: 'images/home/home-hero-1-medium.jpg',
                caption: 'Cycling for All in Bolsover, Grant £9,358 *'
            }),
            createHeroImage({
                small: 'images/home/home-hero-2-small.jpg',
                medium: 'images/home/home-hero-2-medium.jpg',
                large: 'images/home/home-hero-2-large.jpg',
                default: 'images/home/home-hero-2-medium.jpg',
                caption: 'Stepping Stones Programme, Grant £405,270'
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

// funding finder test
router.get('/funding/funding-finder', (req, res) => {
    let parseValueFromString = str => {
        const replacements = [['million', '000000'], [/,/g, ''], [/£/g, ''], [/ /g, '']];

        let upper = str.split(' - ')[1];
        if (upper) {
            replacements.forEach(r => {
                upper = upper.replace(r[0], r[1]);
            });
            upper = parseInt(upper);
        }
        return upper;
    };

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
                                // parse the string (eg. "£10,000" => 10000, "£1 million" => 1000000 etc)
                                let programUpperLimit = parseValueFromString(k.nextSibling.textContent);
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
        req.checkBody('cd_FIRSTNAME', 'Please provide your first name').notEmpty();
        req.checkBody('cd_LASTNAME', 'Please provide your last name').notEmpty();
        req.checkBody('Email', 'Please provide your email address').notEmpty();
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
                // convert location into proper field value
                let location = xss(req.body['location']);
                req.body[location] = 'yes';
                delete req.body['location'];

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
                    req.flash('ebulletinStatus', 'success');
                    req.session.save(() => {
                        // @TODO build this URL more intelligently
                        return res.redirect(localePrefix + '/#' + config.get('anchors.ebulletin'));
                    });
                };

                // send the valid form to the signup endpoint (external)
                rp({
                    method: 'POST',
                    uri: config.get('ebulletinSignup'),
                    form: req.body,
                    resolveWithFullResponse: true,
                    simple: false, // don't let 302s fail
                    followAllRedirects: true
                })
                    .then(response => {
                        // signup succeeded
                        if (response.statusCode === 302 || response.statusCode === 200) {
                            return handleSignupSuccess();
                        } else {
                            console.log('Got an error with redirect', response.statusCode);
                            return handleSignupError();
                        }
                    })
                    .catch(error => {
                        // signup failed
                        console.log('Error signing up to ebulletin', error);
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
