"use strict";
const rp = require('request-promise');
const absolution = require('absolution');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const config = require('config');

const legacyUrl = config.get('legacyDomain');

const postToLegacyForm = (req, res) => {
    res.cacheControl = { maxAge: 0 };

    // work out if we need to serve english/welsh page
    let localePath = req.i18n.getLocale() === 'cy' ? config.get('i18n.urlPrefix.cy') : '';
    let pagePath = localePath + req.path;

    rp
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

const proxyLegacyPage = (req, res) => {
    res.cacheControl = { maxAge: 0 };

    // work out if we need to serve english/welsh page
    let localePath = req.i18n.getLocale() === 'cy' ? config.get('i18n.urlPrefix.cy') : '';
    let pagePath = localePath + req.path;

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
            const dom = new JSDOM(body);

            // @TODO homepage only
            const form = dom.window.document.getElementById('form1');
            if (form) {
                // const newAction = form.getAttribute('action').replace('https://www.biglotteryfund.org.uk/', pagePath);
                form.setAttribute('action', pagePath);
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
            console.log(`Error fetching legacy site page: ${req.path}`, error);
            // @TODO can we send them somewhere better?
            res.redirect('/home');
        });
};

module.exports = {
    proxyLegacyPage,
    postToLegacyForm
};
