const config = require('config');
const moment = require('moment');
const ab = require('express-ab');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/proxy');
const { legacyProxiedRoutes } = require('../routes');
const cached = require('../../middleware/cached');
const Raven = require('raven');

function initAwardsForAll(router) {
    function proxyWithoutChanges(req, res) {
        return proxyLegacyPage(req, res, dom => dom);
    }

    function proxyAwardsForAllTemporaryChangeMe(applyUrl, req, res) {
        return proxyLegacyPage(req, res, dom => {
            res.set('X-BLF-Legacy-Modified', true);

            const applyTab = dom.window.document.querySelector('#mainContentContainer .panel:last-of-type');

            const additionalText = `
                <h4>Apply online</h4>
                <p><br/><a class="roundedButton blueButton" style="display: inline-block;" href="${
                    applyUrl
                }">Apply Online</a></p>
                <h4>Apply by post</h4>
            `;

            if (applyTab && applyTab.textContent.indexOf('please contact us at') !== -1) {
                applyTab.innerHTML = additionalText + applyTab.innerHTML;
            } else {
                Raven.captureMessage('Failed to modify awards for all page', {
                    tags: {
                        feature: 'awards-for-all'
                    }
                });
            }

            return dom;
        });
    }

    function proxyRoute(route) {
        const testFn = ab.test(`blf-afa-rollout-${route.id}`, {
            cookie: {
                name: config.get('cookies.abTestAwardsForAll'),
                maxAge: moment.duration(4, 'weeks').asMilliseconds()
            }
        });

        const percentageForTest = config.get('abTests.tests.awardsForAll.percentage');
        const percentages = {
            A: (100 - percentageForTest) / 100,
            B: percentageForTest / 100
        };

        router.get(route.path, cached.noCache, testFn(null, percentages.A), proxyWithoutChanges);
        router.get(route.path, cached.noCache, testFn(null, percentages.B), route.modifyFn.bind(null, route.applyUrl));
        router.post(route.path, postToLegacyForm);
    }

    const awardsForAllRoutes = [
        {
            id: 'england',
            path: legacyProxiedRoutes.awardsForAllEngland.path,
            applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=en',
            modifyFn: proxyAwardsForAllTemporaryChangeMe
        },
        {
            id: 'scotland',
            path: legacyProxiedRoutes.awardsForAllScotland.path,
            applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=sc',
            modifyFn: proxyAwardsForAllTemporaryChangeMe
        },
        {
            id: 'wales',
            path: legacyProxiedRoutes.awardsForAllWales.path,
            applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=en',
            modifyFn: proxyAwardsForAllTemporaryChangeMe
        },
        {
            id: 'wales-welsh',
            path: legacyProxiedRoutes.awardsForAllWalesWelsh.path,
            applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=welsh',
            modifyFn: proxyAwardsForAllTemporaryChangeMe
        }
    ];

    if (config.get('abTests.enabled')) {
        awardsForAllRoutes.forEach(proxyRoute);
    } else {
        awardsForAllRoutes.forEach(route => {
            router
                .route(route.path)
                .get(cached.noCache, route.modifyFn.bind(null, route.applyUrl))
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
