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
    aliasFor('/funding/programmes', '/Home/Funding/Funding*Finder'),
    aliasFor('/funding/programmes?location=scotland', '/funding/scotland-portfolio'),
    aliasFor(
        '/funding/programmes/national-lottery-awards-for-all-england',
        '/england/global-content/programmes/england/awards-for-all-england'
    ),

    // Migrated Programme Pages [LIVE]
    programmeRedirect('england/awards-for-all-england', 'national-lottery-awards-for-all-england'),
    programmeRedirect('england/reaching-communities-england', 'reaching-communities-england'),
    programmeRedirect('northern-ireland/awards-for-all-northern-ireland', 'awards-for-all-northern-ireland'),
    programmeRedirect('scotland/awards-for-all-scotland', 'national-lottery-awards-for-all-scotland'),
    programmeRedirect('scotland/grants-for-community-led-activity', 'grants-for-community-led-activity'),
    programmeRedirect('scotland/grants-for-improving-lives', 'grants-for-improving-lives'),
    programmeRedirect('wales/people-and-places-medium-grants', 'people-and-places-medium-grants'),
    programmeRedirect('wales/people-and-places-large-grants', 'people-and-places-large-grants'),
    programmeRedirect('uk-wide/uk-portfolio', 'awards-from-the-uk-portfolio'),
    programmeRedirect('uk-wide/coastal-communities', 'coastal-communities-fund'),
    programmeRedirect('uk-wide/lottery-funding', 'other-lottery-funders'),
    programmeRedirect('northern-ireland/people-and-communities', 'people-and-communities'),
    programmeRedirect('wales/awards-for-all-wales', 'national-lottery-awards-for-all-wales'),
    programmeRedirect('england/building-better-opportunities', 'building-better-opportunities'),
    programmeRedirect('scotland/scottish-land-fund', 'scottish-land-fund'),

    // Migrated Programme Pages [DRAFT]
    programmeRedirect('england/parks-for-people', 'parks-for-people', false),
    programmeRedirect('scotland/community-assets', 'community-assets', false),
    programmeRedirect('uk-wide/east-africa-disability-fund', 'east-africa-disability-fund', false),
    programmeRedirect('scotland/our-place', 'our-place', false),
    programmeRedirect('uk-wide/forces-in-mind', 'forces-in-mind', false)
];

/**
 * Vanity URLs
 */
const vanityRedirects = sections => {
    return [
        vanity('/over10k', sections.funding.find('over10k')),
        vanity('/under10k', sections.funding.find('under10k')),
        vanity('/a4aengland', '/funding/programmes/national-lottery-awards-for-all-england'),
        vanity('/prog_a4a_eng', '/funding/programmes/national-lottery-awards-for-all-england'),
        vanity('/awardsforallscotland', '/funding/programmes/national-lottery-awards-for-all-scotland'),
        vanity(
            '/england/global-content/programmes/scotland/awards-for-all-scotland',
            '/funding/programmes/national-lottery-awards-for-all-scotland'
        ),
        vanity('/prog_a4a_ni', '/funding/programmes/awards-for-all-northern-ireland'),
        vanity('/a4awales', '/funding/programmes/national-lottery-awards-for-all-wales'),
        vanity('/prog_a4a_wales', '/funding/programmes/national-lottery-awards-for-all-wales'),
        vanity('/prog_reaching_communities', '/funding/programmes/reaching-communities-england'),
        vanity('/helpingworkingfamilies', '/helping-working-families'),
        vanity('/helputeuluoeddgweithio', '/welsh/helping-working-families'),
        vanity('/improvinglives', '/funding/programmes/grants-for-improving-lives'),
        vanity('/communityled', '/funding/programmes/grants-for-community-led-activity'),
        vanity('/peopleandcommunities', '/funding/programmes/people-and-communities'),
        vanity('/cyhoeddusrwydd', '/welsh/funding/funding-guidance/managing-your-funding'),
        vanity('/ccf', '/funding/programmes/coastal-communities-fund'),
        vanity('/esf', '/funding/programmes/building-better-opportunities'),
        vanity('/scottishlandfund', 'funding/programmes/scottish-land-fund'),
        vanity(
            '/wales/global-content/programmes/scotland/awards-for-all-scotland',
            '/funding/programmes/scottish-land-fund'
        ),
        vanity(
            '/guidancetrackingprogress',
            '/funding/funding-guidance/applying-for-funding/tracking-project-progress/guidance-on-tracking-progress'
        ),
        vanity(
            '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads',
            '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos'
        ),
        vanity('/news-and-events/contact-press-team', `/contact#${anchors.contactPress}`),
        vanity('/welsh/news-and-events/contact-press-team', `/welsh/contact#${anchors.contactPress}`),
        vanity('/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`),
        vanity('/england/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`),
        vanity('/welsh/about-big/customer-service/making-a-complaint', `/welsh/contact#${anchors.contactComplaints}`),
        vanity('/about-big/customer-service/fraud', `/contact#${anchors.contactFraud}`),
        vanity('/welsh/about-big/customer-service/fraud', `/welsh/contact#${anchors.contactFraud}`),
        vanity('/prog_people_places', '/funding/programmes?min=10000&location=wales'),
        vanity('/global-content/programmes/wales/people-and-places', '/funding/programmes?min=10000&location=wales')
    ];
};

module.exports = {
    archivedRoutes,
    legacyRedirects,
    vanityRedirects
};
