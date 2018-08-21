'use strict';
const config = require('config');
const moment = require('moment');

const dataRoute = require('./data');
const feedbackRoute = require('./feedback');
const homepageRoute = require('./homepage');
const robotRoutes = require('./robots');
const searchRoute = require('./search');
const surveyRoute = require('./survey');
const patternLibrary = require('../pattern-library');

module.exports = ({ router, pages }) => {
    /**
     * Robots / Sitemap
     */
    robotRoutes.init({
        router
    });

    /**
     * Homepage
     */
    homepageRoute.init({
        router: router,
        routeConfig: pages.home
    });

    /**
     * Search
     */
    searchRoute.init({
        router: router,
        routeConfig: pages.search
    });

    /**
     * Data
     */
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

    /**
     * Survey (Did you find what you were looking for?)
     */
    surveyRoute.init({ router });

    /**
     * Feedback
     */
    feedbackRoute.init({ router });

    router.use('/patterns', patternLibrary);

    return router;
};
