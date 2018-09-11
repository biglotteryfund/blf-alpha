'use strict';
const config = require('config');
const moment = require('moment');

const dataRoute = require('./data');
const feedbackRoute = require('./feedback');
const surveyRoute = require('./survey');

module.exports = ({ router, pages }) => {
    dataRoute.init({
        router: router,
        routeConfig: pages.data
    });

    // handle contrast shifter
    router.get('/contrast/:mode', (req, res) => {
        res.cacheControl = { maxAge: 1 };

        let cookieName = config.get('cookies.contrast');
        let duration = moment.duration(6, 'months').asMilliseconds();
        let redirectUrl = req.query.url || '/';
        if (req.params.mode === 'high') {
            res.cookie(cookieName, req.params.mode, {
                maxAge: duration,
                httpOnly: false
            });
        } else {
            res.clearCookie(cookieName);
        }
        res.redirect(redirectUrl);
    });

    surveyRoute.init({ router });
    feedbackRoute.init({ router });

    return router;
};
