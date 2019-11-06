'use strict';

module.exports = function(req, res, next) {
    if (req.get('host') === 'apply.tnlcommunityfund.org.uk') {
        res.redirect(301, `https://www.tnlcommunityfund.org.uk/apply`);
    } else {
        next();
    }
};
