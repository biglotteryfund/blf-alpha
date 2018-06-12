'use strict';
const config = require('config');
const moment = require('moment');

const { homepageHero } = require('../../modules/images');
const { sMaxAge } = require('../../middleware/cached');

const dataRoute = require('./data');
const feedbackRoute = require('./feedback');
const homepageRoute = require('./homepage');
const robotRoutes = require('./robots');
const searchRoute = require('./search');
const surveyRoute = require('./survey');

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

    router.get('/prompts', sMaxAge('10m'), (req, res) => {
        res.json({
            prompt: {
                id: 'treejack',
                weight: 0.3,
                message: 'We are working on improving the website.',
                link: {
                    href: 'https://54kuc315.optimalworkshop.com/treejack/4cn0hn5o',
                    label: 'Can you spare a few minutes to take a survey?'
                }
            }
        });
    });

    /**
     * Survey (Did you find what you were looking for?)
     */
    surveyRoute.init({ router });

    /**
     * Feedback
     */
    feedbackRoute.init({ router });

    router.get('/styleguide', (req, res) => {
        const demoStats = [
            {
                value: '42',
                title: 'The meaning of life, the universe, and everything',
                prefix: '',
                suffix: '',
                showNumberBeforeTitle: true
            },
            {
                value: '9m',
                title: 'in Beijing',
                prefix: 'There are',
                suffix: 'bicycles',
                showNumberBeforeTitle: true
            },
            {
                value: '500 miles',
                title: 'I would walk',
                prefix: '',
                suffix: '',
                showNumberBeforeTitle: false
            }
        ];

        res.render('pages/toplevel/styleguide', {
            title: 'Styleguide',
            description: 'Styleguide',
            superHeroImages: homepageHero,
            demoStats: demoStats
        });
    });

    return router;
};
