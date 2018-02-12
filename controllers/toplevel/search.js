const querystring = require('querystring');
const { noCache } = require('../../middleware/cached');
const { trackPageview } = require('../../modules/analytics');

function init({ router, routeConfig }) {
    const queryBase = 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk';
    router.get(routeConfig.path, noCache, (req, res) => {
        if (req.query.q) {
            trackPageview(req);
            res.redirect(`${queryBase}+${querystring.escape(req.query.q)}`);
        } else {
            res.redirect('/');
        }
    });
}

module.exports = {
    init
};
