const querystring = require('querystring');

function init({ router, routeConfig }) {
    const queryBase = 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+';
    router.get(routeConfig.path, (req, res) => {
        if (req.query.q) {
            res.redirect(queryBase + querystring.escape(req.query.q));
        } else {
            res.redirect('/');
        }
    });
}

module.exports = {
    init
};
