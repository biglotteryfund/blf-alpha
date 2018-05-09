'use strict';
const { map } = require('lodash');
const { archived, aliasFor, programmeRedirect } = require('./route-types');
const vanityRedirectsMap = require('../config/app/vanity-redirects.json');

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives
 */
const archivedRoutes = [
    archived('/funding/funding-guidance/applying-for-funding/*'),
    archived('/about-big/10-big-lottery-fund-facts')
];

/**
 * Legacy Redirects
 */
const legacyRedirects = [
    aliasFor('/about/strategic-framework', '/about-big/strategic-framework'),
    aliasFor('/funding', '/funding-uk'),
    aliasFor('/funding', '/funding/funding-guidance'),
    aliasFor('/funding', '/funding/funding-guidance/applying-for-funding'),
    aliasFor('/funding/programmes', '/Home/Funding/Funding*Finder'),
    aliasFor('/funding/programmes?location=scotland', '/funding/scotland-portfolio'),
    aliasFor(
        '/funding/programmes/national-lottery-awards-for-all-england',
        '/england/global-content/programmes/england/awards-for-all-england'
    ),
    aliasFor(
        '/funding/programmes/reaching-communities-england',
        '/england/global-content/programmes/england/reaching-communities-england'
    ),

    // Broken link in https://www.theguardian.com/society/2018/apr/03/travel-training-young-people-learning-disability-cuts-council-costs
    // @TODO: Can we auto strip spaces in URLs?
    aliasFor(
        '/global-content/programmes/england/commissioning-better-outcomes-and-social-outcomes-fund',
        '/global-%20content/programmes/england/commissioning-better-%20outcomes-%20and-social-%20outcomes-fund'
    ),

    aliasFor('/about/customer-service/accessibility', '/about-big/our-approach/accessibility'),

    // Migrated Programme Pages [LIVE]
    programmeRedirect('england/awards-for-all-england', 'national-lottery-awards-for-all-england'),
    programmeRedirect('england/building-better-opportunities', 'building-better-opportunities'),
    programmeRedirect('england/place-based-social-action', 'place-based-social-action'),
    programmeRedirect('england/reaching-communities-england', 'reaching-communities-england'),
    programmeRedirect('northern-ireland/awards-for-all-northern-ireland', 'awards-for-all-northern-ireland'),
    programmeRedirect('northern-ireland/empowering-young-people', 'empowering-young-people'),
    programmeRedirect('northern-ireland/people-and-communities', 'people-and-communities'),
    programmeRedirect('scotland/awards-for-all-scotland', 'national-lottery-awards-for-all-scotland'),
    programmeRedirect('scotland/community-assets', 'community-assets'),
    programmeRedirect('scotland/grants-for-community-led-activity', 'grants-for-community-led-activity'),
    programmeRedirect('scotland/grants-for-improving-lives', 'grants-for-improving-lives'),
    programmeRedirect('scotland/scottish-land-fund', 'scottish-land-fund'),
    programmeRedirect('uk-wide/coastal-communities', 'coastal-communities-fund'),
    programmeRedirect('uk-wide/lottery-funding', 'other-lottery-funders'),
    programmeRedirect('uk-wide/uk-portfolio', 'awards-from-the-uk-portfolio'),
    programmeRedirect('wales/awards-for-all-wales', 'national-lottery-awards-for-all-wales'),
    programmeRedirect('wales/helping-working-families', 'helping-working-families'),
    programmeRedirect('wales/people-and-places-large-grants', 'people-and-places-large-grants'),
    programmeRedirect('wales/people-and-places-medium-grants', 'people-and-places-medium-grants'),

    // Migrated Programme Pages [DRAFT]
    programmeRedirect('scotland/our-place', 'our-place', false),
    programmeRedirect('uk-wide/forces-in-mind', 'forces-in-mind', false)
];

/**
 * Vanity URLs
 */
const vanityRedirects = map(vanityRedirectsMap, (to, from) => ({
    path: from,
    destination: to,
    live: true
}));

module.exports = {
    archivedRoutes,
    legacyRedirects,
    vanityRedirects
};
