const utilities = require('../../modules/utilities');
const proxyLegacy = require('../../modules/proxy');

function init(router) {
    // serve the legacy site funding finder (via proxy)
    router
        .route('/funding/funding-finder')
        .get((req, res) => {
            // rewrite HTML to remove invalid funding programs
            return proxyLegacy.proxyLegacyPage(req, res, dom => {
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
                                        let programUpperLimit = utilities.parseValueFromString(
                                            k.nextSibling.textContent
                                        );
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
        })
        .post(proxyLegacy.postToLegacyForm);

    function proxyAwardsForAll(req, res) {
        return proxyLegacy.proxyLegacyPage(req, res, dom => {
            const applyTab = dom.window.document.querySelector('#mainContentContainer .panel:last-of-type');
            applyTab.innerHTML = `
            <p>Replacement tab content</p>
        `;
            return dom;
        });
    }

    router
        .route('/prog_a4a_eng')
        .get(proxyAwardsForAll)
        .post(proxyLegacy.postToLegacyForm);

    router
        .route('/global-content/programmes/england/awards-for-all-england')
        .get(proxyAwardsForAll)
        .post(proxyLegacy.postToLegacyForm);
}

module.exports = {
    init
};
