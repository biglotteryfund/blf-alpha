'use strict';
const express = require('express');
const app = module.exports = express();
const config = require('config');
const httpProxy = require('http-proxy');
const request = require('request');
const absolution = require('absolution');
const ab = require('express-ab');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// load app routing list
const routes = require('./routes/routes');

// configure boilerplate
require('./boilerplate/viewEngine');
require('./boilerplate/globals');
require('./boilerplate/security');
require('./boilerplate/static');
require('./boilerplate/cache');
require('./boilerplate/middleware');

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

// variant A: new homepage
app.get('/home', testHomepage(null, percentageToSeeNewHomepage / 100), (req, res, next) => {
    res.render('pages/toplevel/home', {
        title: "Homepage"
    });
});

// variant B: existing site (proxied)
app.get('/home', testHomepage(null, (100 - percentageToSeeNewHomepage) / 100), (req, res, next) => {
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

// create status endpoint (used by load balancer)
app.use('/status', require('./routes/toplevel/status'));

// aka welshify - create an array of paths: default (english) and welsh variant
const cymreigio = function (mountPath) {
    let welshPath = config.get('i18n.urlPrefix.cy') + mountPath;
    return [mountPath, welshPath];
};

// route binding

// homepage couldn't be welshified :(
const homepage = require('./routes/toplevel/home');
app.use('/', homepage);
app.use('/welsh', homepage);

// all other routes
for (let section in routes.sections) {
    let s = routes.sections[section];
    let paths = cymreigio(s.path);
    let handler = s.handler(s.pages);
    // adding these as an array fails for welsh paths
    paths.forEach(p => {
        app.use(p, handler);
    });
}

// add vanity redirects
routes.vanityRedirects.forEach(r => {
    app.get(r.path, (req, res, next) => {
        res.redirect(r.destination);
    });
});

const handle404s = () => {
    let err = new Error('Page not found');
    err.status = 404;
    err.friendlyText = "Sorry, we couldn't find that page";
    return err;
};

// alias for error pages for old site -> new
app.get('/error', (req, res, next) => {
    next(handle404s());
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(handle404s());
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.status = err.status || 500;
    res.locals.errorTitle = (err.friendlyText) ? err.friendlyText : 'Error: ' + err.message;

    // render the error page
    res.status(res.locals.status);
    res.render('error');
});