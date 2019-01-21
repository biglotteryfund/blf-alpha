'use strict';

module.exports = function(req, res, next) {
    if (req.get('host') !== 'www.tnlcommunityfund.org.uk') {
        res.redirect(301, `https://www.tnlcommunityfund.org.uk${req.originalUrl}`);
    } else {
        next();
    }
};
