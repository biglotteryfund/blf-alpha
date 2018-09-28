'use strict';
const { flatMapDeep } = require('lodash');
const { makeWelsh } = require('../modules/urls');

/**
 * Aliases
 * Redirect aliases added here will also be handled as
 * welsh and regional variants. Used to clean up old URL paths.
 * Newer vanity URLs are handled in the CMS
 * Syntax: { to: from }
 */
// prettier-ignore
const aliases = {
    '/A4A': '/funding/under10k',
    '/a4a': '/funding/under10k',
    '/about-big': '/about',
    '/about-big/contact-us': '/about',
    '/about-big/customer-service/bogus-lottery-emails': '/about/customer-service/bogus-lottery-emails',
    '/about-big/customer-service/cookies': '/about/customer-service/cookies',
    '/about-big/customer-service/customer-feedback': '/about/customer-service/customer-feedback',
    '/about-big/customer-service/data-protection': '/about/customer-service/data-protection',
    '/about-big/customer-service/fraud': '/contact#segment-6',
    '/about-big/customer-service/freedom-of-information': '/about/customer-service/freedom-of-information',
    '/about-big/customer-service/making-a-complaint': '/contact#segment-5',
    '/about-big/customer-service/privacy-policy': '/about/customer-service/privacy-policy',
    '/about-big/customer-service/terms-of-use': '/about/customer-service/terms-of-use',
    '/about-big/customer-service/welsh-language-scheme': '/about/customer-service/welsh-language-scheme',
    '/about-big/ebulletin-subscription': '/about/ebulletin',
    '/about-big/ebulletin': '/about/ebulletin',
    '/about-big/helping-millions-change-their-lives': '/about/strategic-framework',
    '/about-big/jobs': '/jobs',
    '/about-big/jobs/benefits': '/jobs/benefits',
    '/about-big/jobs/current-vacancies': '/jobs',
    '/about-big/jobs/how-to-apply': '/jobs',
    '/about-big/our-approach/accessibility': '/about/customer-service/accessibility',
    '/about-big/our-people/senior-management-team': '/about/our-people/senior-management-team',
    '/about-big/strategic-framework': '/about/strategic-framework',
    '/about-big/strategic-framework/our-vision': '/about/strategic-framework',
    '/about-big/tender-opportunities': '/about/customer-service/supplier-zone',
    '/awardsforall': '/funding/under10k',
    '/cymru': '/welsh/wales',
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
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/help-with-publicity': '/funding/funding-guidance/managing-your-funding',
    '/funding/funding-guidance/managing-your-funding/logodownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales': '/funding/funding-guidance/managing-your-funding/ordering-free-materials',
    '/funding/funding-guidance/managing-your-funding/self-evaluation': '/funding/funding-guidance/managing-your-funding/evaluation',
    '/funding/scotland-portfolio': '/funding/programmes?location=scotland',
    '/global-content/programmes/england/awards-for-all-england': '/funding/programmes/national-lottery-awards-for-all-england',
    '/global-content/programmes/england/building-better-opportunities': '/funding/programmes/building-better-opportunities',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-resources': '/funding/programmes/building-better-opportunities/building-better-opportunities-resources',
    '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding': '/funding/programmes/building-better-opportunities/guide-to-delivering-european-funding',
    '/global-content/programmes/england/fulfilling-lives-headstart': '/funding/strategic-investments/headstart',
    '/global-content/programmes/england/place-based-social-action': '/funding/programmes/place-based-social-action',
    '/global-content/programmes/england/reaching-communities-england': '/funding/programmes/reaching-communities-england',
    '/global-content/programmes/northern-ireland/awards-for-all-northern-ireland': '/funding/programmes/awards-for-all-northern-ireland',
    '/global-content/programmes/northern-ireland/empowering-young-people': '/funding/programmes/empowering-young-people',
    '/global-content/programmes/northern-ireland/people-and-communities': '/funding/programmes/people-and-communities',
    '/global-content/programmes/scotland/awards-for-all-scotland': '/funding/programmes/national-lottery-awards-for-all-scotland',
    '/global-content/programmes/scotland/community-assets': '/funding/programmes/community-assets',
    '/global-content/programmes/scotland/grants-for-community-led-activity': '/funding/programmes/grants-for-community-led-activity',
    '/global-content/programmes/scotland/grants-for-improving-lives': '/funding/programmes/grants-for-improving-lives',
    '/global-content/programmes/scotland/our-place': '/funding/programmes/our-place',
    '/global-content/programmes/scotland/scottish-land-fund': '/funding/programmes/scottish-land-fund',
    '/global-content/programmes/scotland/young-start': '/funding/programmes/young-start',
    '/global-content/programmes/uk-wide/coastal-communities': '/funding/programmes/coastal-communities-fund',
    '/global-content/programmes/uk-wide/forces-in-mind': '/funding/programmes/forces-in-mind',
    '/global-content/programmes/uk-wide/lottery-funding': '/funding/programmes/other-lottery-funders',
    '/global-content/programmes/uk-wide/the-peoples-projects': '/funding/programmes/the-peoples-projects',
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
    '/news-and-events/contact-press-team': '/contact#segment-4',
    '/northernireland': '/northern-ireland',
    '/over10k': '/funding/over10k',
    '/prog_people_places': '/funding/programmes?min=10000&location=wales',
    '/publicity': '/funding/funding-guidance/managing-your-funding',
    '/scotland': '/',
    '/uk-wide': '/',
    '/under10k': '/funding/under10k',
    '/welcome': '/funding/funding-guidance/managing-your-funding',
    '/yourgrant': '/funding/funding-guidance/managing-your-funding/ordering-free-materials',
};

const mappedAliases = flatMapDeep(aliases, (to, from) => {
    const prefixes = ['', '/england', '/scotland', '/northernireland', '/wales'];
    return prefixes.map(prefix => {
        const withPrefix = `${prefix}${from}`;
        const enRedirect = { from: withPrefix, to: to };
        const cyRedirect = { from: makeWelsh(withPrefix), to: makeWelsh(to) };
        return [enRedirect, cyRedirect];
    });
});

module.exports = mappedAliases;
