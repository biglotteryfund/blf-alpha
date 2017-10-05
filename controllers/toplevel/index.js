'use strict';
const express = require('express');
const config = require('config');
const router = express.Router();
const rp = require('request-promise');
const absolution = require('absolution');
const ab = require('express-ab');
const jsdom = require('jsdom');
const _ = require('lodash');
const { JSDOM } = jsdom;
const xss = require('xss');

const app = require('../../server');
const routeStatic = require('../utils/routeStatic');
const regions = require('../../config/content/regions.json');
const models = require('../../models/index');

const robots = require('../../config/app/robots.json');
// block everything on non-prod envs
if (app.get('env') !== 'production') {
    robots.push('/');
}
const assets = require('../../modules/assets');

const legacyUrl = config.get('legacyDomain');

const newHomepage = (req, res) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };

    const serveHomepage = news => {
        const lang = req.i18n.__('toplevel.home');

        const heroImageDefault = {
            small: assets.getCachebustedPath('images/hero/home-hero-1--small.jpg'),
            large: assets.getCachebustedPath('images/hero/home-hero-1--large.jpg'),
            default: assets.getCachebustedPath('images/hero/home-hero-1--small.jpg'),
            caption: 'Cloughmills Community Action, Grant £4,975*'
        };

        const heroImageCandidates = [
            heroImageDefault,
            {
                small: assets.getCachebustedPath('images/hero/home-hero-2--small.jpg'),
                large: assets.getCachebustedPath('images/hero/home-hero-2--large.jpg'),
                default: assets.getCachebustedPath('images/hero/home-hero-2--small.jpg'),
                caption: 'Stepping Stones Programme, Grant £405,270'
            },
            {
                small: assets.getCachebustedPath('images/hero/home-hero-3--small.jpg'),
                large: assets.getCachebustedPath('images/hero/home-hero-3--large.jpg'),
                default: assets.getCachebustedPath('images/hero/home-hero-3--small.jpg'),
                caption: 'Cycling for All in Bolsover, Grant £9,358 *'
            }
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

// @TODO cache this page as it's very slow to return
// main issue is the static assets (which cloudfront doesn't cache)
const oldHomepage = (req, res) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };

    // work out if we need to serve english/welsh page
    let localePath = req.i18n.getLocale() === 'cy' ? config.get('i18n.urlPrefix.cy') : '';

    return rp({
        url: legacyUrl + localePath,
        strictSSL: false,
        jar: true,
        resolveWithFullResponse: true
    })
        .then(response => {
            let body = response.body;
            // convert all links in the document to be absolute
            // (only really useful on non-prod envs)
            body = absolution(body, 'https://www.biglotteryfund.org.uk');

            // fix meta tags in HTML which use the wrong CNAME
            body = body.replace(/wwwlegacy/g, 'www');

            // parse the DOM
            const dom = new JSDOM(body);

            const form = dom.window.document.getElementById('form1');
            if (form) {
                const newAction = form.getAttribute('action').replace('https://www.biglotteryfund.org.uk/', '/');
                form.setAttribute('action', newAction);
            }

            // are we in an A/B test?
            if (res.locals.ab) {
                // create GA snippet for tracking experiment
                const gaCode = `
                <script src="//www.google-analytics.com/cx/api.js"></script>
                <script>
                    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                            (i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),
                        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
                    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
                    ga('create', '${config.get('googleAnalyticsCode')}', {
                        'cookieDomain': 'none'
                    });
                    ga('set', 'expId', '${res.locals.ab.id}');
                    ga('set', 'expVar', ${res.locals.ab.variantId});
                    cxApi.setChosenVariation(${res.locals.ab.variantId}, '${res.locals.ab.id}');
                    ga('send', 'pageview');
                </script>`;

                // insert GA experiment code into the page
                const script = dom.window.document.createElement('div');
                script.innerHTML = gaCode;
                dom.window.document.body.appendChild(script);

                // try to kill the google tag manager (useful for non-prod envs)
                // @TODO kill the noscript too?
                // @TODO don't do this on prod?
                const scripts = dom.window.document.scripts;
                let gtm = [].find.call(scripts, s => s.innerHTML.indexOf('www.googletagmanager.com/gtm.js') !== -1);
                if (gtm) {
                    gtm.innerHTML = '';
                }
            }
            res.set('X-BLF-Legacy', true);
            res.send(dom.serialize());
        })
        .catch(error => {
            // we failed to fetch from the proxy, redirect to new
            console.log('Error fetching legacy site', error);
            res.redirect('/home');
        });
};

const oldHomepagePost = (req, res) => {
    res.cacheControl = { maxAge: 0 };
    rp
        .post({
            uri: legacyUrl,
            form: req.body,
            strictSSL: false,
            jar: true,
            simple: true,
            followRedirect: false,
            resolveWithFullResponse: true,
            followOriginalHttpMethod: true
        })
        .catch(err => {
            const proxyResponse = err.response;
            if (proxyResponse.statusCode === 302) {
                res.redirect(302, proxyResponse.headers.location);
            } else {
                res.redirect('/');
            }
        });
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

    router.post('/', oldHomepagePost);

    // used for tests: override A/B cohorts
    router.get('/home', newHomepage);
    router.get('/legacy', oldHomepage);

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
        let grants = _.sortBy(regions, 'name');
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
