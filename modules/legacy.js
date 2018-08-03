'use strict';
const { get } = require('lodash');
const absolution = require('absolution');
const config = require('config');
const jsdom = require('jsdom');
const ms = require('ms');
const request = require('request-promise-native');

const { isWelsh, makeWelsh, removeWelsh } = require('../modules/urls');

const { JSDOM } = jsdom;
const legacyUrl = config.get('legacyDomain');

/**
 * 1. Convert all links in the document to be absolute
 *    (only really useful on non-prod envs)
 * 2. Fix meta tags in HTML which use the wrong CNAME
 */
function cleanBody(body) {
    const prodDomain = 'https://www.biglotteryfund.org.uk';
    return absolution(body, prodDomain).replace(/wwwlegacy/g, 'www');
}

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

    return request({
        url: legacyUrl + req.originalUrl,
        strictSSL: false,
        jar: true,
        followRedirect: followRedirect,
        maxRedirects: 1,
        resolveWithFullResponse: true,
        timeout: ms('60s')
    }).then(response => {
        const contentType = response.headers['content-type'];

        if (/^text\/html/.test(contentType)) {
            const originalUrlPath = req.baseUrl + req.path;
            const body = cleanBody(response.body);
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
                let liveUrl = `https://${config.get('siteDomain')}`;
                redirectDestination = redirectDestination.replace(liveUrl, '');
                return res.redirect(301, redirectDestination);
            }
        }
        // either it wasn't a redirect, or Sitecore said no
        return next();
    });
}

function postToLegacyForm(req, res, next) {
    res.cacheControl = { maxAge: 0 };

    // work out if we need to serve english/welsh page
    let localePath = req.i18n.getLocale() === 'cy' ? config.get('i18n.urlPrefix.cy') : '';
    let pagePath = localePath + req.baseUrl + req.path;

    return request
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
            if (proxyResponse && proxyResponse.statusCode === 302) {
                res.redirect(302, proxyResponse.headers.location);
            } else {
                next();
            }
        });
}

module.exports = {
    proxyLegacyPage,
    proxyPassthrough,
    postToLegacyForm
};
