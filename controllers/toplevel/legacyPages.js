const config = require('config');
const moment = require('moment');
const ab = require('express-ab');
const utilities = require('../../modules/utilities');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/proxy');
const { legacyProxiedRoutes } = require('../routes');

function initFundingFinder(router) {
    function proxyFundingFinder(req, res) {
        // rewrite HTML to remove invalid funding programs
        return proxyLegacyPage(req, res, dom => {
            // should we filter out programs under 10k?
            if (req.query.over && req.query.over === '10k') {
                // get the list of program elements
                let programs = dom.window.document.querySelectorAll('article.programmeList');
                if (programs.length > 0) {
                    [].forEach.call(programs, p => {
                        // find the key facts block (which contains the funding size)
                        let keyFacts = p.querySelectorAll('.taxonomy-keyFacts dt');
                        if (keyFacts.length > 0) {
                            [].forEach.call(keyFacts, k => {
                                // find the node with the funding size info (if it exists)
                                let textValue = k.textContent.toLowerCase();
                                // english/welsh version
                                if (['funding size:', 'maint yr ariannu:'].indexOf(textValue) !== -1) {
                                    // convert string into number
                                    let programUpperLimit = utilities.parseValueFromString(k.nextSibling.textContent);
                                    // remove the element if it's below our threshold
                                    if (programUpperLimit <= 10000) {
                                        p.parentNode.removeChild(p);
                                    }
                                }
                            });
                        }
                    });
                }
            }
            return dom;
        });
    }

    router
        .route(legacyProxiedRoutes.fundingFinder.path)
        .get(proxyFundingFinder)
        .post(postToLegacyForm);
}

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

            applyTab.innerHTML = additionalText + applyTab.innerHTML;

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

        router.get(route.path, testFn(null, percentages.A), proxyWithoutChanges);
        router.get(route.path, testFn(null, percentages.B), route.modifyFn.bind(null, route.applyUrl));
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
                .get(route.modifyFn)
                .post(postToLegacyForm);
        });
    }
}

function init(router) {
    initFundingFinder(router);
    initAwardsForAll(router);
}

module.exports = {
    init
};
