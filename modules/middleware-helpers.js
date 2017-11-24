const csurf = require('csurf');

// Apply consistent no-cache headers
const noCache = (req, res, next) => {
    res.cacheControl = { noStore: true };
    next();
};

// Apply csrf protection and no-cache at the same time
const csrfProtection = [csurf(), noCache];

module.exports = {
    noCache,
    csrfProtection
};
