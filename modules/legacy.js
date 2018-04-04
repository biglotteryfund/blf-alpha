'use strict';
const Raven = require('raven');
const config = require('config');
const { get } = require('lodash');
const rp = require('request-promise-native');
const absolution = require('absolution');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const appData = require('../modules/appData');
const { isWelsh, makeWelsh, removeWelsh } = require('../modules/urls');

const legacyUrl = config.get('legacyDomain');

const proxyLegacyPage = ({ req, res, domModifications, followRedirect = true }) => {
    res.cacheControl = { maxAge: 0 };

    return rp({
        url: legacyUrl + req.path,
        qs: req.query,
        strictSSL: false,
        jar: true,
        followRedirect: followRedirect,
        maxRedirects: 1,
        resolveWithFullResponse: true
    }).then(response => {
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

        const regionNav = dom.window.document.getElementById('regionNav');
        const pageIsWelsh = isWelsh(req.path);
        const hasWelshLink = regionNav.querySelectorAll('[hreflang="cy"]').length > 0;
        const hasEnglishLink = regionNav.querySelectorAll('[hreflang="en"]').length > 0;

        const appendLanguageLink = (localeToAppend, nav) => {
            const linkPath = localeToAppend === 'cy' ? makeWelsh(req.path) : removeWelsh(req.path);
            const linkText = localeToAppend === 'cy' ? 'Cymraeg' : 'English';
            const listItem = dom.window.document.createElement('li');
            listItem.setAttribute('id', 'ctl12_langLi');
            listItem.setAttribute('class', 'last');
            listItem.innerHTML = `
                <a href="${linkPath}"
                   id="ctl12_welshLanguage"
                   lang="${localeToAppend}"
                   hreflang="${localeToAppend}"
                   data-blf-alpha="true">
                   ${linkText}
               </a>`;
            nav.appendChild(listItem);
        };

        // some pages aren't welsh but *do* have the link
        // other pages aren't welsh but don't (due to cookies etc)
        if (!pageIsWelsh && !hasWelshLink) {
            appendLanguageLink('cy', regionNav);
        } else if (pageIsWelsh && !hasEnglishLink) {
            appendLanguageLink('en', regionNav);
        }

        // rewrite main ASP.net form to point to this page
        // (currently it's rewritten above to the external one)
        const form = dom.window.document.getElementById('form1');
        if (form) {
            form.setAttribute('action', req.path);
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

        // Remove live chat widget as document.write causes issue when proxying.
        const liveChat = dom.window.document.getElementById('askLiveCall');
        if (liveChat) {
            liveChat.parentNode.removeChild(liveChat);
        }

        // Allow custom overrides on a per-page basis
        if (domModifications) {
            dom = domModifications(dom);
        }

        res.set('X-BLF-Legacy', true);
        res.send(dom.serialize());
    });
};

const proxyPassthrough = (req, res, next) => {
    return proxyLegacyPage({
        req,
        res,
        followRedirect: false
    }).catch(function(err) {
        // some URLs are redirects, so let's see if this was one
        if (err.statusCode === 301 || err.statusCode === 302) {
            // was it a valid redirect or Sitecore's broken 404 page?
            const brokenSitecorePath = '/sitecore/service/notfound.aspx';
            let redirectDestination = get(err, 'response.headers.location', false);

            if (redirectDestination.indexOf(brokenSitecorePath) === -1) {
                // Make the redirect relative to the current environment
                // (they seem to come back from Sitecore with an absolute path)
                let liveUrl = `https://${config.get('siteDomain')}`;
                redirectDestination = redirectDestination.replace(liveUrl, '');
                return res.redirect(301, redirectDestination);
            }
        }
        // either it wasn't a redirect, or Sitecore said no
        return next();
    });
};

const postToLegacyForm = (req, res, next) => {
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
                next();
            }
        });
};

const redirectUglyLink = (req, res) => {
    const handleError = err => {
        Raven.captureException(err);
        res.redirect('/');
    };

    const livePagePath = `${legacyUrl}${req.originalUrl}`;
    rp({
        url: livePagePath,
        strictSSL: false,
        jar: true,
        resolveWithFullResponse: false,
        maxRedirects: 1
    })
        .then(response => {
            let dom = new JSDOM(response);
            let metaIdentifier = dom.window.document.querySelector('meta[name="identifier"]');
            let intendedUrl = metaIdentifier.getAttribute('content');
            if (!metaIdentifier || !intendedUrl) {
                return handleError(new Error('Unable to find meta identifier URL'));
            }
            res.redirect(301, intendedUrl);
        })
        .catch(handleError);
};

module.exports = {
    proxyLegacyPage,
    proxyPassthrough,
    postToLegacyForm,
    redirectUglyLink
};
