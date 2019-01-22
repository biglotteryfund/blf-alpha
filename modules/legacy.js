'use strict';
const { get } = require('lodash');
const jsdom = require('jsdom');
const ms = require('ms');
const request = require('request-promise-native');

const appData = require('./appData');
const { isWelsh, makeWelsh, removeWelsh, stripTrailingSlashes } = require('../modules/urls');

const { JSDOM } = jsdom;

function getCanonicalUrl(dom) {
    const metaIdentifier = dom.window.document.querySelector('meta[name="identifier"]');
    return metaIdentifier && metaIdentifier.getAttribute('content');
}

/**
 * Append language link
 * Always append a language link if there isn't one on the page.
 */
function appendLanguageLink(dom, originalUrlPath) {
    const pageIsWelsh = isWelsh(originalUrlPath);
    const regionNav = dom.window.document.getElementById('regionNav');
    const hasWelshLink = regionNav.querySelectorAll('[hreflang="cy"]').length > 0;
    const hasEnglishLink = regionNav.querySelectorAll('[hreflang="en"]').length > 0;

    const injectLink = (localeToAppend, nav) => {
        const linkPath = localeToAppend === 'cy' ? makeWelsh(originalUrlPath) : removeWelsh(originalUrlPath);
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

    if (!pageIsWelsh && !hasWelshLink) {
        injectLink('cy', regionNav);
    } else if (pageIsWelsh && !hasEnglishLink) {
        injectLink('en', regionNav);
    }
}

function cleanDom(dom, originalUrlPath) {
    // Inject a <base> with the production url in non-production environments
    // Prevents legacy resources being loaded from dev/urls
    if (appData.isNotProduction) {
        const head = dom.window.document.getElementsByTagName('head')[0];
        const base = dom.window.document.createElement('base');
        base.href = 'https://www.biglotteryfund.org.uk';
        head.insertBefore(base, head.firstChild);
    }

    appendLanguageLink(dom, originalUrlPath);

    // rewrite main ASP.net form to point to this page
    // (currently it's rewritten above to the external one)
    const form = dom.window.document.getElementById('form1');
    if (form) {
        form.setAttribute('action', originalUrlPath);
    }

    // Remove live chat widget as document.write causes issue when proxying.
    const liveChat = dom.window.document.getElementById('askLiveCall');
    if (liveChat) {
        liveChat.parentNode.removeChild(liveChat);
    }
}

function proxyLegacyPage({ req, res, followRedirect = true }) {
    res.cacheControl = { maxAge: 0 };

    /**
     * Our default CSP policy is too strict for legacy pages so remove it.
     */
    if (!res.headersSent) {
        res.removeHeader('Content-Security-Policy');
    }

    const proxyUrl = `https://wwwlegacy.biglotteryfund.org.uk${req.originalUrl}`;
    const originalUrlPath = stripTrailingSlashes(req.baseUrl + req.path);

    return request({
        url: proxyUrl,
        strictSSL: false,
        jar: true,
        followRedirect: followRedirect,
        maxRedirects: 1,
        resolveWithFullResponse: true,
        timeout: ms('60s')
    }).then(response => {
        const contentType = response.headers['content-type'];

        if (/^text\/html/.test(contentType)) {
            // Fix meta tags in HTML which use the wrong CNAME
            const body = response.body.replace(/wwwlegacy/g, 'www');
            const dom = new JSDOM(body);

            /**
             * Always redirect to canonical link
             * Sitecore serves the content of vanity URLs rather
             * than redirecting, so to avoid duplicate content and make it
             * easier to replace old URLs we attempt to look up the canonical URL
             * from the page and redirect to that.
             */
            const canonicalUrl = getCanonicalUrl(dom);
            if (canonicalUrl && canonicalUrl !== originalUrlPath) {
                res.redirect(301, canonicalUrl);
            } else {
                cleanDom(dom, originalUrlPath);
                res.set('X-BLF-Legacy', true);
                res.send(dom.serialize());
            }
        } else {
            res.send(response.body);
        }
    });
}

function proxyPassthrough(req, res, next) {
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
                redirectDestination = redirectDestination.replace('https://www.biglotteryfund.org.uk', '');
                return res.redirect(301, redirectDestination);
            }
        }
        // either it wasn't a redirect, or Sitecore said no
        return next();
    });
}

module.exports = {
    proxyLegacyPage,
    proxyPassthrough
};
