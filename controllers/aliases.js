'use strict';

const config = require('config');
const { archived, aliasFor, vanity, programmeRedirect } = require('./route-types');

const anchors = config.get('anchors');

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
const vanityRedirects = [
    vanity('/cymru', '/welsh/wales'),
    vanity('/over10k', '/funding/over10k'),
    vanity('/under10k', '/funding/under10k'),
    vanity('/englandwebinars', '/funding/programmes/national-lottery-awards-for-all-england'),
    vanity(
        '/england/global-content/programmes/scotland/awards-for-all-scotland',
        '/funding/programmes/national-lottery-awards-for-all-scotland'
    ),
    vanity(
        '/england/global-content/programmes/wales/awards-for-all-wales',
        '/funding/programmes/national-lottery-awards-for-all-wales'
    ),
    vanity(
        '/scotland/global-content/programmes/wales/awards-for-all-wales',
        '/funding/programmes/national-lottery-awards-for-all-wales'
    ),
    vanity(
        '/wales/global-content/programmes/wales/awards-for-all-wales',
        '/funding/programmes/national-lottery-awards-for-all-wales'
    ),
    vanity('/improvinglives', '/funding/programmes/grants-for-improving-lives'),
    vanity('/communityled', '/funding/programmes/grants-for-community-led-activity'),
    vanity('/peopleandcommunities', '/funding/programmes/people-and-communities'),
    vanity('/cyhoeddusrwydd', '/welsh/funding/funding-guidance/managing-your-funding'),
    vanity('/ccf', '/funding/programmes/coastal-communities-fund'),
    vanity('/esf', '/funding/programmes/building-better-opportunities'),
    vanity('/scottishlandfund', 'funding/programmes/scottish-land-fund'),
    vanity('/slf', 'funding/programmes/scottish-land-fund'),
    vanity('/communityassets', 'funding/programmes/community-assets'),
    vanity('/prog_growing_community_assets', 'funding/programmes/community-assets'),
    vanity(
        '/wales/global-content/programmes/scotland/awards-for-all-scotland',
        '/funding/programmes/national-lottery-awards-for-all-scotland'
    ),
    vanity(
        '/guidancetrackingprogress',
        '/funding/funding-guidance/applying-for-funding/tracking-project-progress/guidance-on-tracking-progress'
    ),
    vanity(
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads',
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos'
    ),
    vanity(
        '/funding/funding-guidance/managing-your-funding/self-evaluation',
        '/funding/funding-guidance/managing-your-funding/evaluation'
    ),
    vanity('/news-and-events/contact-press-team', `/contact#${anchors.contactPress}`),
    vanity('/welsh/news-and-events/contact-press-team', `/welsh/contact#${anchors.contactPress}`),
    vanity('/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`),
    vanity('/england/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`),
    vanity('/welsh/about-big/customer-service/making-a-complaint', `/welsh/contact#${anchors.contactComplaints}`),
    vanity('/about-big/customer-service/fraud', `/contact#${anchors.contactFraud}`),
    vanity('/welsh/about-big/customer-service/fraud', `/welsh/contact#${anchors.contactFraud}`),
    vanity('/prog_people_places', '/funding/programmes?min=10000&location=wales'),
    vanity('/global-content/programmes/wales/people-and-places', '/funding/programmes?min=10000&location=wales'),
    vanity('/headstart', '/global-content/programmes/england/fulfilling-lives-headstart'),
    vanity('/funded-projects', '/funding/past-grants')
];

module.exports = {
    archivedRoutes,
    legacyRedirects,
    vanityRedirects
};
