const config = require('config');
const moment = require('moment');
const ab = require('express-ab');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/proxy');
const { legacyProxiedRoutes } = require('../routes');
const cached = require('../../middleware/cached');
const Raven = require('raven');

function initAwardsForAll(router) {
    function getReplacementText({ applyUrl, contactPhone }) {
        const sharedText = `
            <p>We are currently trialling a quicker and more straightforward online application form for National Lottery Awards for All. Please follow the link below if you are ready to begin filling in your application:</p>
            <p><a class="roundedButton blueButton" style="display: inline-block;" href="${
                applyUrl
            }">Apply Online</a></p>
            <p>You will be able to quickly set up an account, save your application form, and return to work on it as required. <strong>If you would like to apply online, please visit the link above and bookmark it in your browser so that you can access it later, as it is not yet visible to all visitors to this page</strong>.</p>
            <p>We are keen to hear any feedback – positive or negative - and to help with any questions or problems you may have. Please do get in touch with us to discuss any of this by calling <strong>${
                contactPhone
            }</strong></p>
            <p>Please note that you can still submit an application by email or post if preferred.</p>
        `;

        return {
            tab: `
                <h3>Apply online</h3>
                ${sharedText}
                <h3>Apply by email or post</h3>
            `,
            extra: `
                <h3>Apply online</h3>
                ${sharedText}
            `
        };
    }

    function modify(replacementText) {
        return function(req, res) {
            return proxyLegacyPage(req, res, dom => {
                res.set('X-BLF-Legacy-Modified', true);

                const applyTab = dom.window.document.querySelector('#mainContentContainer .panel:last-of-type');
                if (applyTab && applyTab.textContent.indexOf('please contact us at') !== -1) {
                    applyTab.innerHTML = replacementText.tab + applyTab.innerHTML;
                } else {
                    Raven.captureMessage('Failed to modify awards for all tab content', {
                        tags: {
                            feature: 'awards-for-all'
                        }
                    });
                }

                const mainContent = dom.window.document.getElementById('accordionContainer');
                if (mainContent) {
                    const fragment = dom.window.document.createDocumentFragment();
                    const newEl = dom.window.document.createElement('div');
                    newEl.style = 'margin-top: 20px';
                    newEl.innerHTML = replacementText.extra;
                    fragment.appendChild(newEl);
                    mainContent.appendChild(fragment);
                } else {
                    Raven.captureMessage('Failed to modify awards for all main content', {
                        tags: {
                            feature: 'awards-for-all'
                        }
                    });
                }

                return dom;
            });
        };
    }

    const awardsForAllRoutes = [
        {
            id: 'england',
            path: legacyProxiedRoutes.awardsForAllEngland.path,
            modifyFn: modify(
                getReplacementText({
                    applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=en',
                    contactPhone: '0345 4 10 20 30'
                })
            )
        },
        {
            id: 'scotland',
            path: legacyProxiedRoutes.awardsForAllScotland.path,
            modifyFn: modify(
                getReplacementText({
                    applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=sc',
                    contactPhone: '0300 123 7110'
                })
            )
        },
        {
            id: 'wales',
            path: legacyProxiedRoutes.awardsForAllWales.path,
            modifyFn: modify(
                getReplacementText({
                    applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=en',
                    contactPhone: '0300 123 0735'
                })
            )
        },
        {
            id: 'wales-welsh',
            path: legacyProxiedRoutes.awardsForAllWalesWelsh.path,
            modifyFn: modify(
                getReplacementText({
                    applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=wales&ln=welsh',
                    contactPhone: '0300 123 0735'
                })
            )
        }
    ];

    if (config.get('abTests.enabled')) {
        awardsForAllRoutes.forEach(route => {
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

            router.get(route.path, cached.noCache, testFn(null, percentages.A), function proxyWithoutChanges(req, res) {
                return proxyLegacyPage(req, res, dom => dom);
            });
            router.get(route.path, cached.noCache, testFn(null, percentages.B), route.modifyFn);
            router.post(route.path, postToLegacyForm);
        });
    } else {
        awardsForAllRoutes.forEach(route => {
            router
                .route(route.path)
                .get(cached.noCache, route.modifyFn)
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
