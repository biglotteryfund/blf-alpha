const config = require('config');
const moment = require('moment');
const ab = require('express-ab');
const Raven = require('raven');
const { get } = require('lodash');
const { legacyProxiedRoutes } = require('../routes');
const { splitPercentages } = require('../../modules/ab');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/proxy');
const cached = require('../../middleware/cached');

function initAwardsForAll(router) {
    function getReplacementText(originalText, replacements) {
        return {
            A: `
                <p>There are current two ways to apply, via PDF application form or via a trial online application form.</p>
                <h3>Applying via email or post</h3>
                <p>The usual method for applying is via a PDF form that you email or post to us. To apply this way:</p>
                ${originalText}
                <h3>Applying using the trial online form</h3>
                <p>We are trialling a new application process with a small number of users. If you are part of the online trial <a href="${
                    replacements.applyUrl
                }">continue your application here</a>.</p>
            `,
            B: `
                <p>There are current two ways to apply, via PDF application form or via online application form.
                </p>
                <h3>Applying using the online form</h3>
                <p>We are trialling a new application process where you can submit an application via a web form, rather than downloading a PDF.</p>
                <p><a class="roundedButton blueButton" style="display: inline-block;" href="${
                    replacements.applyUrl
                }">Apply Online</a></p>
                <p>This new form is a trial only open to a limited number of applicants. We’d love your feedback on how you find the experience.</p>
                <h3>Applying via email or post</h3>
                <p>You are also welcome to apply via email or post using our PDF form. To apply this way:</p>
                ${originalText}
            `
        };
    }

    function modify(variant, replacements) {
        return function(req, res) {
            return proxyLegacyPage(req, res, dom => {
                res.set('X-BLF-Legacy-Modified', true);
                const TAB_SELECTOR = '#mainContentContainer .panel:last-of-type';
                const applyTab = dom.window.document.querySelector(TAB_SELECTOR);
                if (applyTab && applyTab.textContent.indexOf('please contact us at') !== -1) {
                    const replacementText = getReplacementText(applyTab.innerHTML, replacements)[variant];
                    applyTab.innerHTML = replacementText;
                } else {
                    Raven.captureMessage('Failed to modify awards for all tab content', {
                        tags: {
                            feature: 'awards-for-all'
                        }
                    });
                }

                const relatedDocuments = dom.window.document.getElementById('relatedDocsContainer');
                if (relatedDocuments) {
                    relatedDocuments.parentNode.removeChild(relatedDocuments);
                }

                return dom;
            });
        };
    }

    const awardsForAllRoutes = [
        {
            id: 'england',
            path: legacyProxiedRoutes.awardsForAllEngland.path,
            experimentId: 'O9FsbkKfSeOammAP0JrEyA',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=en',
                contactPhone: '0345 4 10 20 30'
            }
        },
        {
            id: 'scotland',
            path: legacyProxiedRoutes.awardsForAllScotland.path,
            experimentId: 'EcAwbF34R5mbCaWW-y_rFQ',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=sc',
                contactPhone: '0300 123 7110'
            }
        },
        {
            id: 'wales',
            path: legacyProxiedRoutes.awardsForAllWales.path,
            experimentId: 'Ko6MLYegQfaRO1rVU1UB3w',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=en',
                contactPhone: '0300 123 0735'
            }
        },
        {
            id: 'wales-welsh',
            path: legacyProxiedRoutes.awardsForAllWalesWelsh.path,
            experimentId: 'Ko6MLYegQfaRO1rVU1UB3w',
            replacements: {
                applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=welsh',
                contactPhone: '0300 123 0735'
            }
        }
    ];

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

            router.get(route.path, cached.noCache, testFn(null, percentages.A), modify('A', route.replacements));
            router.get(route.path, cached.noCache, testFn(null, percentages.B), modify('B', route.replacements));
            router.post(route.path, postToLegacyForm);
        });
    } else {
        awardsForAllRoutes.forEach(route => {
            router
                .route(route.path)
                .get(cached.noCache, function proxyWithoutChanges(req, res) {
                    return proxyLegacyPage(req, res, dom => dom);
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
