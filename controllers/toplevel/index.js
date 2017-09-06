'use strict';
const express = require('express');
const config = require('config');
const router = express.Router();
const rp = require('request-promise');
const httpProxy = require('http-proxy');
const absolution = require('absolution');
const ab = require('express-ab');
const jsdom = require('jsdom');
const _ = require('lodash');
const { JSDOM } = jsdom;
const xss = require('xss');

const routeStatic = require('../utils/routeStatic');
const grants = require('../../bin/data/grantnav.json');
const regions = require('../../config/content/regions.json');
const models = require('../../models/index');
const robots = require('../../config/app/robots.json');

// configure proxy server for A/B testing old site
const legacyUrl = config.get('legacyDomain');
const percentageToSeeNewHomepage = config.get('abTests.tests.homepage.percentage');
const proxy = httpProxy.createProxyServer({
    target: legacyUrl,
    changeOrigin: true,
    secure: false
});

// log errors fetching proxy
proxy.on('error', (e) => {
    console.log('Proxy error', e);
});

// create an A/B test
let testHomepage = ab.test('blf-homepage-2017', {
    cookie: {
        name: config.get('abTests.cookieName'),
        maxAge: 60 * 60 * 24 * 30 // 30 days
    },
    id: config.get('abTests.tests.homepage.id') // google experiment ID
});

let newHomepage = (req, res, next) => {
    let serveHomepage = (news) => {
        res.render('pages/toplevel/home', {
            title: "Homepage",
            news: news || []
        });
    };

    // get news articles
    try {
        models.News.findAll({
            limit: 3,
            order: [['updatedAt', 'DESC']]
        }).then(serveHomepage);
    } catch (e) {
        console.log('Could not find news posts');
        serveHomepage();
    }
};

// @TODO cache this page as it's very slow to return
// (or will cloudfront cover us?)
let oldHomepage = (req, res, next) => {
    return rp({
        url: legacyUrl,
        strictSSL: false,
        jar: true,
        resolveWithFullResponse: true
    }).then((response) => {
        let body = response.body;
        // convert all links in the document to be root-relative
        // (only really useful on non-prod envs)
        body = absolution(body, 'https://www.biglotteryfund.org.uk');

        // fix meta tags in HTML which use the wrong CNAME
        body = body.replace(/wwwlegacy/g, 'www');

        // parse the DOM
        const dom = new JSDOM(body);

        // are we in an A/B test?
        if (res.locals.ab) {
            // create GA snippet for tracking experiment
            const gaCode = `
                    <script src="//www.google-analytics.com/cx/api.js"></script>
                    <script>
                        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                                (i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),
                            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
                        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
                        ga('create', '${config.get('googleAnalyticsCode')}', {
                            'cookieDomain': 'none'
                        });
                        // console.log('tracking test', ${JSON.stringify(res.locals.ab)});
                        ga('set', 'expId', '${res.locals.ab.id}');
                        ga('set', 'expVar', ${res.locals.ab.variantId});
                        cxApi.setChosenVariation(${res.locals.ab.variantId}, '${res.locals.ab.id}');
                        ga('send', 'pageview');
                    </script>`;

            // insert GA experiment code into the page
            const script = dom.window.document.createElement("div");
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
        // pass the headers
        res.set(response.headers);
        res.send(dom.serialize());

    }).catch(error => {
        // we failed to fetch from the proxy, redirect to new
        console.log('Error fetching legacy site', error);
        res.redirect('/home');
    });
};

module.exports = (pages, sectionPath, sectionId) => {

    /**
     * 1. Populate static pages
     */
    routeStatic.initRouting(pages, router, sectionPath, sectionId);

    // variant 0/A: existing site (proxied)
    router.get('/', testHomepage(null, (100 - percentageToSeeNewHomepage) / 100), oldHomepage);

    // variant 1/B: new homepage
    router.get('/', testHomepage(null, percentageToSeeNewHomepage / 100), newHomepage);

    // used for tests: override A/B cohorts
    router.get('/home', newHomepage);
    router.get('/legacy', oldHomepage);

    // send form data to the (third party) email newsletter provider
    router.post('/ebulletin', (req, res, next) => {
        req.checkBody('cd_FIRSTNAME', 'Please provide your first name').notEmpty();
        req.checkBody('cd_LASTNAME', 'Please provide your last name').notEmpty();
        req.checkBody('Email', 'Please provide your email address').notEmpty();
        req.checkBody('location', 'Please choose a country newsletter').notEmpty();

        req.getValidationResult().then((result) => {

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

                // redirect errors back to the homepage
                let handleSignupError = () => {
                    req.flash('ebulletinStatus', 'error');
                    req.session.save(() => {
                        return res.redirect('/#' + config.get('anchors.ebulletin'));
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
                }).then(response => { // signup succeeded
                    if (response.statusCode === 302 || response.statusCode === 200) {
                        req.flash('ebulletinStatus', 'success');
                        req.session.save(() => {
                            return res.redirect('/#' + config.get('anchors.ebulletin'));
                        });
                    } else {
                        console.log('Got an error with redirect', response.statusCode);
                        return handleSignupError();
                    }
                }).catch(error => { // signup failed
                    console.log('Error signing up to ebulletin', error);
                    return handleSignupError();
                });
            }
        });
    });

    // data page
    router.get(pages.data.path, (req, res, next) => {
        let grants = _.sortBy(regions, 'name');
        res.render('pages/toplevel/data', {
            grants: grants,
            copy: req.i18n.__(pages.data.lang)
        });
    });

    // lookup for the data page
    router.get('/lookup', (req, res, next) => {

        let postcode = req.query.postcode;
        rp('http://api.postcodes.io/postcodes/' + encodeURIComponent(postcode)).then((data) => {
            let json = JSON.parse(data);
            let yourDistrict = json.result.admin_district;
            let matches = grants.grants.filter(d => {
                if (typeof d.recipientDistrictName !== 'undefined') {
                    return d.recipientDistrictName.indexOf(yourDistrict) !== -1;
                } else {
                    return false;
                }
            });
            if (matches.length > 0) {
                res.render('pages/grants', {
                    grants: matches,
                    postcode: postcode
                });
            } else {
                console.log('GET /lookup found a valid postcode but no matching grants', {
                    postcode: postcode,
                    district: yourDistrict
                });
                res.status(302).redirect('/');
            }
        }).catch(() => {
            console.log('GET /lookup received an invalid postcode', {
                postcode: postcode
            });
            res.status(302).redirect('/');
        });

    });

    // handle contrast shifter
    router.get('/contrast/:mode', (req, res, next) => {
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

    router.get('/robots.txt', (req, res, next) => {
        res.setHeader('Content-Type', 'text/plain');
        let text = 'User-agent: *\n';
        robots.forEach(r => {
            text += `Disallow: ${r}\n`;
        });
        res.send(text);
    });

    return router;
};