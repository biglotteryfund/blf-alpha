const { parseValueFromString } = require('../../modules/utilities');
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
                                    let programUpperLimit = parseValueFromString(k.nextSibling.textContent);
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

function init(router) {
    initFundingFinder(router);
}

module.exports = {
    init
};
