const csurf = require('csurf');
module.exports = [
    csurf(),
    (req, res, next) => {
        res.cacheControl = { maxAge: 0, noStore: true };
        next();
    }
];
