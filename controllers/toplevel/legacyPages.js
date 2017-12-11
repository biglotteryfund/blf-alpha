const config = require('config');
const moment = require('moment');
const ab = require('express-ab');
const Raven = require('raven');
const { get, includes } = require('lodash');
const { legacyProxiedRoutes } = require('../routes');
const { splitPercentages } = require('../../modules/ab');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/proxy');
const cached = require('../../middleware/cached');

function initAwardsForAll(router) {
    const awardsForAllRoutes = [
        {
            id: 'england',
            lang: 'en',
            path: legacyProxiedRoutes.awardsForAllEngland.path,
            experimentId: 'O9FsbkKfSeOammAP0JrEyA',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=en',
                contactPhone: '0345 4 10 20 30'
            }
        },
        {
            id: 'scotland',
            lang: 'en',
            path: legacyProxiedRoutes.awardsForAllScotland.path,
            experimentId: 'EcAwbF34R5mbCaWW-y_rFQ',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=sc',
                contactPhone: '0300 123 7110'
            }
        },
        {
            id: 'wales',
            lang: 'en',
            path: legacyProxiedRoutes.awardsForAllWales.path,
            experimentId: 'Ko6MLYegQfaRO1rVU1UB3w',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=en',
                contactPhone: '0300 123 0735'
            }
        },
        {
            id: 'wales-welsh',
            lang: 'cy',
            path: legacyProxiedRoutes.awardsForAllWalesWelsh.path,
            experimentId: 'Ko6MLYegQfaRO1rVU1UB3w',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=welsh',
                contactPhone: '0300 123 0735'
            }
        }
    ];

    function getReplacementText(originalText, replacements) {
        return {
            A: `
                <p>There are currently two ways to apply, via PDF application form or via a trial online application form.</p>
                <h3>Applying via email or post</h3>
                <p>The usual method for applying is via a PDF form that you email or post to us. To apply this way:</p>
                ${originalText}
                <h3>Applying using the trial online form</h3>
                <p>We are trialling a new application process with a small number of users. If you are part of the online trial <a href="${
                    replacements.applyUrl
                }&variant=A">continue your application here</a>.</p>
            `,
            B: `
                <p>There are currently two ways to apply, via PDF application form or via online application form.
                </p>
                <h3>Applying using the online form</h3>
                <p>We are trialling a new application process where you can submit an application via a web form, rather than downloading a PDF.</p>
                <p><a class="roundedButton blueButton" style="display: inline-block;" href="${
                    replacements.applyUrl
                }&variant=B">Apply Online</a></p>
                <p>This new form is a trial only open to a limited number of applicants. We’d love your feedback on how you find the experience.</p>
                <h3>Applying via email or post</h3>
                <p>You are also welcome to apply via email or post using our PDF form. To apply this way:</p>
                ${originalText}
            `
        };
    }

    function getReplacementTextWelsh(originalText, replacements) {
        return {
            A: `
                <p>Ar hyn o bryd mae dau ddull ymgeisio, trwy ffurflen gais PDF neu drwy ffurflen gais ar-lein.</p>
                <h3>Ymgeisio trwy e-bost neu’r post</h3>
                <p>Y dull ymgeisio arferol yw trwy ffurflen PDF yr ydych yn ei hanfon atom trwy e-bost neu’r post. I wneud hwn:</p>
                ${originalText}
                <h3>Ymgeisio gan ddefnyddio’r ffurflen dreial ar-lein</h3>
                <p>Rydym yn treialu proses ymgeisio newydd gyda nifer bach o ddefnyddwyr. Os ydych yn rhan o’r treial ar-lein <a href="${
                    replacements.applyUrl
                }&variant=A">parhewch â’ch cais yma</a>.</p>
            `,
            B: `
                <p>Ar hyn o bryd mae dau ddull ymgeisio, trwy ffurflen gais PDF neu drwy ffurflen gais ar-lein.</p>
                <h3>Ymgeisio gan ddefnyddio’r ffurflen ar-lein</h3>
                <p>Rydym yn treialu proses ymgeisio newydd sy’n galluogi chi i gyflwyno cais trwy ffurflen we’n hytrach na lawrlwytho PDF.</p>
                <p><a class="roundedButton blueButton" style="display: inline-block;" href="${
                    replacements.applyUrl
                }&variant=B">Cais Ar-lein</a></p>
                <p>Mae’r ffurflen newydd hon yn dreial sy’n agored i nifer bach o ymgeiswyr yn unig. Byddem yn gwerthfawrogi’n fawr cael adborth gennych ar sut brofiad yr oedd.</p>
                <h3>Ymgeisio trwy e-bost neu’r post</h3>
                <p>Mae croeso hefyd i chi ymgeisio trwy e-bost neu’r post gan ddefnyddio ein ffurflen PDF. I wneud hwn:</p>
                ${originalText}
            `
        };
    }

    function modify(variant, route) {
        return function(req, res) {
            return proxyLegacyPage(
                req,
                res,
                dom => {
                    res.set('X-BLF-Legacy-Modified', true);

                    // Find the tab to inject content into.
                    const applyTab = dom.window.document.querySelector('#mainContentContainer .panel:last-of-type');

                    // Determine how to process the text depending on language. Include a sanity check of the text.
                    const modifyFn = route.lang === 'cy' ? getReplacementTextWelsh : getReplacementText;
                    const includesText = route.lang === 'cy' ? 'cysylltwch â ni yn' : 'please contact us at';

                    // Apply text modifications
                    if (applyTab && includes(applyTab.textContent, includesText)) {
                        const replacementText = modifyFn(applyTab.innerHTML, route.replacements)[variant];
                        applyTab.innerHTML = replacementText;
                    } else {
                        Raven.captureMessage('Failed to modify awards for all tab content', {
                            tags: {
                                feature: 'awards-for-all'
                            }
                        });
                    }

                    // Remove live chat, document.write on live causes issue when proxying.
                    const liveChat = dom.window.document.getElementById('askLiveCall');
                    if (liveChat) {
                        liveChat.parentNode.removeChild(liveChat);
                    }

                    // Remove related documents
                    const relatedDocuments = dom.window.document.getElementById('relatedDocsContainer');
                    if (relatedDocuments) {
                        relatedDocuments.parentNode.removeChild(relatedDocuments);
                    }

                    return dom;
                },
                route.path
            );
        };
    }

    if (config.get('abTests.enabled')) {
        awardsForAllRoutes.forEach(route => {
            const testFn = ab.test(`blf-afa-rollout-${route.id}`, {
                cookie: {
                    name: config.get('cookies.abTestAwardsForAll'),
                    maxAge: moment.duration(4, 'weeks').asMilliseconds()
                },
                id: get(route, 'experimentId', null)
            });

            const percentageForTest = config.get('abTests.tests.awardsForAll.percentage');
            const percentages = splitPercentages(percentageForTest);

            router.get(route.path, cached.noCache, testFn(null, percentages.A), modify('A', route));
            router.get(route.path, cached.noCache, testFn(null, percentages.B), modify('B', route));
            router.post(route.path, postToLegacyForm);
        });
    } else {
        awardsForAllRoutes.forEach(route => {
            router
                .route(route.path)
                .get(cached.noCache, function proxyWithoutChanges(req, res) {
                    return proxyLegacyPage(req, res, dom => dom, route.path);
                })
                .post(postToLegacyForm);
        });
    }
}

function init(router) {
    initAwardsForAll(router);
}

module.exports = {
    init
};
