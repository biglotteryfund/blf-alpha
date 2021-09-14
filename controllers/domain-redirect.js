'use strict';

module.exports = function (req, res, next) {
    if (req.get('host') === 'apply.tnlcommunityfund.org.uk') {
        res.redirect(301, `https://www.tnlcommunityfund.org.uk/apply`);
    } else if (req.get('host') === 'www.celebratenationallottery25.com'
        || req.get('host') === 'celebratenationallottery25.com'
        || req.get('host') === 'apply.celebratenationallottery25.com') {
        res.redirect(301, 'https://www.tnlcommunityfund.org.uk/funding/programmes/celebratenationallottery25');
    } else {
        next();
    }
};
