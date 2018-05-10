'use strict';
const { flatten, map } = require('lodash');
const { archived, aliasFor, programmeRedirect } = require('./route-types');

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
const legacyRedirects = flatten([
    aliasFor('/funding-guidance/help-using-our-application-forms', [
        '/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms'
    ]),
    aliasFor('/funding/funding-guidance/information-checks', [
        '/informationchecks',
        '/funding/funding-guidance/applying-for-funding/information-checks'
    ]),
    aliasFor('/about/strategic-framework', '/about-big/strategic-framework'),
    aliasFor('/funding', [
        '/funding-uk',
        '/funding/funding-guidance',
        '/funding/funding-guidance/applying-for-funding'
    ]),
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

    aliasFor('/about/customer-service/accessibility', '/about-big/our-approach/accessibility'),

    // Manage your funding
    aliasFor('/funding/funding-guidance/managing-your-funding', [
        '/funding/funding-guidance/managing-your-funding/help-with-publicity',
        '/welcome',
        '/publicity'
    ]),

    // Logos
    aliasFor('/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos', [
        '/funding/funding-guidance/managing-your-funding/logodownloads',
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads',
        '/logos'
    ]),

    // Free materials
    aliasFor('/funding/funding-guidance/managing-your-funding/ordering-free-materials', [
        '/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales',
        '/wales/funding/funding-guidance/managing-your-funding/ordering-free-materials',
        '/scotland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
        '/england/funding/funding-guidance/managing-your-funding/ordering-free-materials',
        '/northernireland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
        '/yourgrant'
    ]),

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
]);

/**
 * Vanity URLs
 */
// prettier-ignore
const vanityRedirects = map({
    '/about-big/customer-service/fraud': '/contact#fraud',
    '/about-big/customer-service/making-a-complaint': '/contact#complaints',
    '/ccf': '/funding/programmes/coastal-communities-fund',
    '/communityassets': 'funding/programmes/community-assets',
    '/communityled': '/funding/programmes/grants-for-community-led-activity',
    '/cyhoeddusrwydd': '/welsh/funding/funding-guidance/managing-your-funding',
    '/cymru': '/welsh/wales',
    '/england/about-big/customer-service/making-a-complaint': '/contact#complaints',
    '/england/global-content/programmes/scotland/awards-for-all-scotland': '/funding/programmes/national-lottery-awards-for-all-scotland',
    '/england/global-content/programmes/wales/awards-for-all-wales': '/funding/programmes/national-lottery-awards-for-all-wales',
    '/englandwebinars': '/funding/programmes/national-lottery-awards-for-all-england',
    '/esf': '/funding/programmes/building-better-opportunities',
    '/funded-projects': '/funding/past-grants',
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/self-evaluation': '/funding/funding-guidance/managing-your-funding/evaluation',
    '/global-content/programmes/wales/people-and-places': '/funding/programmes?min=10000&location=wales',
    '/guidancetrackingprogress': '/funding/funding-guidance/applying-for-funding/tracking-project-progress/guidance-on-tracking-progress',
    '/headstart': '/global-content/programmes/england/fulfilling-lives-headstart',
    '/improvinglives': '/funding/programmes/grants-for-improving-lives',
    '/news-and-events/contact-press-team': '/contact#press',
    '/over10k': '/funding/over10k',
    '/peopleandcommunities': '/funding/programmes/people-and-communities',
    '/prog_growing_community_assets': 'funding/programmes/community-assets',
    '/prog_people_places': '/funding/programmes?min=10000&location=wales',
    '/scotland/global-content/programmes/wales/awards-for-all-wales': '/funding/programmes/national-lottery-awards-for-all-wales',
    '/scottishlandfund': 'funding/programmes/scottish-land-fund',
    '/under10k': '/funding/under10k',
    '/slf': 'funding/programmes/scottish-land-fund',
    '/wales/global-content/programmes/scotland/awards-for-all-scotland': '/funding/programmes/national-lottery-awards-for-all-scotland',
    '/wales/global-content/programmes/wales/awards-for-all-wales': '/funding/programmes/national-lottery-awards-for-all-wales',
    '/welsh/about-big/customer-service/fraud': '/welsh/contact#fraud',
    '/welsh/about-big/customer-service/making-a-complaint': '/welsh/contact#complaints',
    '/welsh/news-and-events/contact-press-team': '/welsh/contact#press'
}, (to, from) => ({
    path: from,
    destination: to,
    live: true
}));

module.exports = {
    archivedRoutes,
    legacyRedirects,
    vanityRedirects
};
