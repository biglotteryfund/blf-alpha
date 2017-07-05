'use strict';
const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const httpProxy = require('http-proxy');
const request = require('request'); // @TODO do we need this? use rp?
const absolution = require('absolution');
const ab = require('express-ab');
const config = require('config');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const grants = require('../../bin/data/grantnav.json');
const logger = require('../../logger');

const legacyUrl = 'https://wwwlegacy.biglotteryfund.org.uk';
const percentageToSeeNewHomepage = 100;

// configure proxy for old site
const proxy = httpProxy.createProxyServer({
    target: legacyUrl,
    changeOrigin: true,
    secure: false
});

// todo: save this to debug logs
proxy.on('error', function(e) {
    console.log('Proxy error', e);
});

// create an A/B test
let testHomepage = ab.test('blf-homepage-2017', {
    cookie: {
        name: 'blf-ab',
        maxAge: 123456
    },
    id: 'pR1e00a0Q42tSZuvQdaqpA'
});

router.post('/ebulletin', (req, res, next) => {
    req.checkBody('cd_FIRSTNAME', 'Please provide your first name').notEmpty();
    req.checkBody('cd_LASTNAME', 'Please provide your last name').notEmpty();
    req.checkBody('Email', 'Please provide your email address').notEmpty();

    req.getValidationResult().then((result) => {
        // sanitise input
        req.body['cd_FIRSTNAME'] = req.sanitize('cd_FIRSTNAME').escape();
        req.body['cd_LASTNAME'] = req.sanitize('cd_LASTNAME').escape();
        req.body['Email'] = req.sanitize('Email').escape();
        req.body['cd_ORGANISATION'] = req.sanitize('cd_ORGANISATION').escape();

        if (!result.isEmpty()) {
            req.session.errors = result.array();
            req.session.values = req.body;
            res.redirect('/home#ebulletin');
        } else {
            // send the valid form to the signup endpoint (external)
            res.redirect(307, 'http://bigmail.org.uk/signup.ashx');
        }
    });
});

// variant A: new homepage
router.get('/home', testHomepage(null, percentageToSeeNewHomepage / 100), (req, res, next) => {
    // @TODO retrieve form errors/values
    res.render('pages/toplevel/home', {
        title: "Homepage"
    });

    // @TODO flash session
    delete req.session.errors;
});

// variant B: existing site (proxied)
router.get('/home', testHomepage(null, (100 - percentageToSeeNewHomepage) / 100), (req, res, next) => {
    // @TODO this doesn't pass on any client cookies - should it?
    request({
        url: legacyUrl,
        strictSSL: false
    }, function (error, response, body) {
        if (error) {
            // @TODO is there a better fix for this?
            res.send(error);
        } else {
            // convert all links in the document to be root-relative
            // (only really useful on non-prod envs)
            body = absolution(body, 'https://www.biglotteryfund.org.uk');

            // fix meta tags in HTML which use the wrong CNAME
            body = body.replace(/wwwlegacy/g, 'www');

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
                    console.log('tracking test', ${JSON.stringify(res.locals.ab)});
                    ga('set', 'expId', '${res.locals.ab.id}');
                    ga('set', 'expVar', ${res.locals.ab.variantId});
                    cxApi.setChosenVariation(${res.locals.ab.variantId}, '${res.locals.ab.id}');
                    ga('send', 'pageview');
                </script>`;

            // insert GA experiment code into the page
            const dom = new JSDOM(body);
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

            res.send(dom.serialize());
        }
    });
});

// data page, confusingly
router.get('/', (req, res, next) => {
    res.render('pages/index', {});
});

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
            logger.log('info', 'GET /lookup found a valid postcode but no matching grants', {
                postcode: postcode,
                district: yourDistrict
            });
            res.status(302).redirect('/');
        }
    }).catch(() => {
        logger.log('info', 'GET /lookup received an invalid postcode', {
            postcode: postcode
        });
        res.status(302).redirect('/');
    });

});

module.exports = router;
