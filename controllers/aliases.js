'use strict';
const { concat, flatMap, map } = require('lodash');
const { archived } = require('./route-types');
const { makeWelsh } = require('../modules/urls');

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
// prettier-ignore
const legacyRedirects = flatMap({
    '/a4a': '/funding/under10k',
    '/A4A': '/funding/under10k',
    '/about-big': '/about',
    '/about-big/contact-us': '/about',
    '/about-big/customer-service/bogus-lottery-emails': '/about/customer-service/bogus-lottery-emails',
    '/about-big/customer-service/cookies': '/about/customer-service/cookies',
    '/about-big/customer-service/customer-feedback': '/about/customer-service/customer-feedback',
    '/about-big/customer-service/data-protection': '/about/customer-service/data-protection',
    '/about-big/customer-service/fraud': '/contact#fraud',
    '/about-big/customer-service/freedom-of-information': '/about/customer-service/freedom-of-information',
    '/about-big/customer-service/making-a-complaint': '/contact#complaints',
    '/about-big/customer-service/privacy-policy': '/about/customer-service/privacy-policy',
    '/about-big/customer-service/terms-of-use': '/about/customer-service/terms-of-use',
    '/about-big/customer-service/welsh-language-scheme': '/about/customer-service/welsh-language-scheme',
    '/about-big/ebulletin-subscription': '/about/ebulletin',
    '/about-big/ebulletin': '/about/ebulletin',
    '/about-big/jobs': '/jobs',
    '/about-big/jobs/benefits': '/jobs/benefits',
    '/about-big/jobs/current-vacancies': '/jobs',
    '/about-big/jobs/how-to-apply': '/jobs',
    '/about-big/our-approach/accessibility': '/about/customer-service/accessibility',
    '/about-big/strategic-framework': '/about/strategic-framework',
    '/awardsforall': '/funding/under10k',
    '/data-protection': '/about/customer-service/data-protection',
    '/ebulletin': '/about/ebulletin',
    '/en-gb': '/',
    '/england': '/',
    '/englandwebinars': '/funding/programmes/national-lottery-awards-for-all-england',
    '/freedom-of-information': '/about/customer-service/freedom-of-information',
    '/funded-projects': '/funding/past-grants',
    '/funding-uk': '/funding',
    '/funding/Awards-For-All': '/funding/under10k',
    '/funding/awards-for-all': '/funding/under10k',
    '/funding/funding-guidance': '/funding',
    '/funding/funding-guidance/applying-for-funding': '/funding',
    '/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms': '/funding-guidance/help-using-our-application-forms',
    '/funding/funding-guidance/applying-for-funding/information-checks': '/funding/funding-guidance/information-checks',
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/help-with-publicity': '/funding/funding-guidance/managing-your-funding',
    '/funding/funding-guidance/managing-your-funding/logodownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/ordering-free-materials': '/funding/funding-guidance/managing-your-funding/ordering-free-materials',
    '/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales': '/funding/funding-guidance/managing-your-funding/ordering-free-materials',
    '/funding/funding-guidance/managing-your-funding/self-evaluation': '/funding/funding-guidance/managing-your-funding/evaluation',
    '/funding/scotland-portfolio': '/funding/programmes?location=scotland',
    '/global-content/programmes/england/awards-for-all-england': '/funding/programmes/national-lottery-awards-for-all-england',
    '/global-content/programmes/england/building-better-opportunities': '/funding/programmes/building-better-opportunities',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-resources': '/funding/programmes/building-better-opportunities/building-better-opportunities-resources',
    '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding': '/funding/programmes/building-better-opportunities/guide-to-delivering-european-funding',
    '/global-content/programmes/england/place-based-social-action': '/funding/programmes/place-based-social-action',
    '/global-content/programmes/england/reaching-communities-england': '/funding/programmes/reaching-communities-england',
    '/global-content/programmes/northern-ireland/awards-for-all-northern-ireland': '/funding/programmes/awards-for-all-northern-ireland',
    '/global-content/programmes/northern-ireland/empowering-young-people': '/funding/programmes/empowering-young-people',
    '/global-content/programmes/northern-ireland/people-and-communities': '/funding/programmes/people-and-communities',
    '/global-content/programmes/scotland/awards-for-all-scotland': '/funding/programmes/national-lottery-awards-for-all-scotland',
    '/global-content/programmes/scotland/community-assets': '/funding/programmes/community-assets',
    '/global-content/programmes/scotland/grants-for-community-led-activity': '/funding/programmes/grants-for-community-led-activity',
    '/global-content/programmes/scotland/grants-for-improving-lives': '/funding/programmes/grants-for-improving-lives',
    '/global-content/programmes/scotland/scottish-land-fund': '/funding/programmes/scottish-land-fund',
    '/global-content/programmes/uk-wide/coastal-communities': '/funding/programmes/coastal-communities-fund',
    '/global-content/programmes/uk-wide/lottery-funding': '/funding/programmes/other-lottery-funders',
    '/global-content/programmes/uk-wide/uk-portfolio': '/funding/programmes/awards-from-the-uk-portfolio',
    '/global-content/programmes/wales/awards-for-all-wales': '/funding/programmes/national-lottery-awards-for-all-wales',
    '/global-content/programmes/wales/helping-working-families': '/funding/programmes/helping-working-families',
    '/global-content/programmes/wales/people-and-places-large-grants': '/funding/programmes/people-and-places-large-grants',
    '/global-content/programmes/wales/people-and-places-medium-grants': '/funding/programmes/people-and-places-medium-grants',
    '/global-content/programmes/wales/people-and-places': '/funding/programmes?min=10000&location=wales',
    '/guidancetrackingprogress': '/funding/funding-guidance/applying-for-funding/tracking-project-progress/guidance-on-tracking-progress',
    '/help-and-support': '/about',
    '/home': '/',
    '/home/funding': '/funding',
    '/Home/Funding/Funding*Finder': '/funding/programmes',
    '/index.html': '/',
    '/logos': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/news-and-events/contact-press-team': '/contact#press',
    '/publicity': '/funding/funding-guidance/managing-your-funding',
    '/scotland': '/',
    '/uk-wide': '/',
    '/welcome': '/funding/funding-guidance/managing-your-funding',
    '/welsh/about-big/customer-service/fraud': '/welsh/contact#fraud',
    '/welsh/about-big/customer-service/making-a-complaint': '/welsh/contact#complaints',
    '/welsh/news-and-events/contact-press-team': '/welsh/contact#press',
    '/yourgrant': '/funding/funding-guidance/managing-your-funding/ordering-free-materials',
}, (to, from) => {
    return flatMap(['', '/england', '/scotland', '/northern-ireland', '/wales'], oldRegionPrefix => {
        const fromWithRegion = `${oldRegionPrefix}${from}`;
        const enRedirect = { from: fromWithRegion, to: to };
        const cyRedirect = { from: makeWelsh(fromWithRegion), to: makeWelsh(to) };
        return [enRedirect, cyRedirect];
    });
});

/**
 * Vanity URLs
 * @TODO: Move remaining items in here to the CMS
 */
// prettier-ignore
const vanityRedirects = map({
    '/ccf': '/funding/programmes/coastal-communities-fund',
    '/communityassets': 'funding/programmes/community-assets',
    '/communityled': '/funding/programmes/grants-for-community-led-activity',
    '/cyhoeddusrwydd': '/welsh/funding/funding-guidance/managing-your-funding',
    '/cymru': '/welsh/wales',
    '/esf': '/funding/programmes/building-better-opportunities',
    '/headstart': '/global-content/programmes/england/fulfilling-lives-headstart',
    '/improvinglives': '/funding/programmes/grants-for-improving-lives',
    '/informationchecks': '/funding/funding-guidance/information-checks',
    '/northernireland': '/northern-ireland',
    '/over10k': '/funding/over10k',
    '/peopleandcommunities': '/funding/programmes/people-and-communities',
    '/prog_growing_community_assets': 'funding/programmes/community-assets',
    '/prog_people_places': '/funding/programmes?min=10000&location=wales',
    '/scottishlandfund': 'funding/programmes/scottish-land-fund',
    '/slf': 'funding/programmes/scottish-land-fund',
    '/under10k': '/funding/under10k',
}, (to, from) => ({ to, from }));

const redirects = concat(legacyRedirects, vanityRedirects);

module.exports = {
    archivedRoutes,
    redirects
};
