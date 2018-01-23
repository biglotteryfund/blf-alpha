'use strict';
const Raven = require('raven');
const config = require('config');
const { get } = require('lodash');
const rp = require('request-promise-native');
const absolution = require('absolution');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const appData = require('../modules/appData');
const cheerio = require('cheerio');

const legacyUrl = config.get('legacyDomain');

const postToLegacyForm = (req, res) => {
    res.cacheControl = { maxAge: 0 };

    // work out if we need to serve english/welsh page
    let localePath = req.i18n.getLocale() === 'cy' ? config.get('i18n.urlPrefix.cy') : '';
    let pagePath = localePath + req.path;

    return rp
        .post({
            uri: legacyUrl + pagePath,
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
                // @TODO can we send them somewhere better?
                res.redirect('/home');
            }
        });
};

const proxyLegacyPage = (req, res, domModifications, pathOverride) => {
    res.cacheControl = { maxAge: 0 };

    // work out if we need to serve english/welsh page
    let localePath = req.i18n.getLocale() === 'cy' ? config.get('i18n.urlPrefix.cy') : '';

    // allow a custom path (eg. to serve / over /legacy)
    // which would otherwise fail
    let pagePath = pathOverride ? pathOverride : localePath + req.path;

    return rp({
        url: legacyUrl + pagePath,
        qs: req.query,
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
            let dom = new JSDOM(body);

            if (appData.isDev) {
                let titleText = dom.window.document.title;
                dom.window.document.title = '[PROXIED] ' + titleText;
            }

            // rewrite main ASP.net form to point to this page
            // (currently it's rewritten above to the external one)
            const form = dom.window.document.getElementById('form1');
            if (form) {
                form.setAttribute('action', pagePath);
            }

            /**
             * Are we in an A/B test and do we have a Google Experiments ID
             */
            const experimentId = get(res.locals, 'ab.id');
            const variantId = get(res.locals, 'ab.variantId');
            if (experimentId) {
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
                    ga('set', 'expId', '${experimentId}');
                    ga('set', 'expVar', ${variantId});
                    cxApi.setChosenVariation(${variantId}, '${experimentId}');
                    ga('send', 'pageview');
                </script>`;

                // insert GA experiment code into the page
                const script = dom.window.document.createElement('div');
                script.innerHTML = gaCode;
                dom.window.document.body.appendChild(script);

                // try to kill the google tag manager (useful for non-prod envs)
                const scripts = dom.window.document.scripts;
                let gtm = [].find.call(scripts, s => s.innerHTML.indexOf('www.googletagmanager.com/gtm.js') !== -1);
                if (gtm) {
                    gtm.innerHTML = '';
                }
            }

            // allow custom overrides on a per-page basis
            if (domModifications) {
                dom = domModifications(dom);
            }

            res.set('X-BLF-Legacy', true);
            res.send(dom.serialize());
        })
        .catch(error => {
            /**
             * We failed to fetch from the proxy, redirect to new
             * @TODO can we send them somewhere better?
             */
            Raven.captureException(error);
            res.redirect('/home');
        });
};

const redirectUglyLink = (req, res) => {
    let handleError = () => res.redirect('/');
    const livePagePath = `https://${config.get('siteDomain')}${req.originalUrl}`;
    rp({
        url: livePagePath,
        strictSSL: false,
        jar: true,
        resolveWithFullResponse: false,
        maxRedirects: 1
    })
        .then(response => {
            const $ = cheerio.load(response);
            let canonicalUrl = $('meta[name="identifier"]').attr('content');
            if (!canonicalUrl) {
                return handleError();
            }
            res.redirect(301, canonicalUrl);
        })
        .catch(handleError);
};

module.exports = {
    proxyLegacyPage,
    postToLegacyForm,
    redirectUglyLink
};
