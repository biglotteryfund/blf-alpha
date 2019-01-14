'use strict';
const { flatMap } = require('lodash');
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
    '/about-big/contact-us': '/about',
    '/about-big/countries/about-england/strategic-investments-in-england': '/funding/strategic-investments',
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
    '/about-big/our-approach': '/about',
    '/about-big/our-approach/about-big-lottery-fund': '/about',
    '/about-big/our-approach/accessibility': '/about/customer-service/accessibility',
    '/about-big/our-approach/equalities': '/about/customer-service/equalities',
    '/about-big/our-approach/equalities/learn-about-equality': '/about/customer-service/equalities',
    '/about-big/our-approach/equalities/northern-ireland-equality': '/about/customer-service/northern-ireland-equality',
    '/about-big/our-approach/international-funding': '/funding/funding-guidance/international-funding',
    '/about-big/our-approach/non-lotttery-funding': '/funding/funding-guidance/non-lottery-funding',
    '/about-big/our-people/england-committee-members': '/about/our-people/england-committee',
    '/about-big/our-people/northern-ireland-committee-members': '/about/our-people/northern-ireland-committee',
    '/about-big/our-people/senior-management-team': '/about/our-people/senior-management-team',
    '/about-big/our-people/wales-committee-members': '/about/our-people/wales-committee',
    '/about-big/publications/corporate-documents': '/about/customer-service/corporate-documents',
    '/about-big/strategic-framework': '/about/strategic-framework',
    '/about-big/strategic-framework/our-vision': '/about/strategic-framework',
    '/about-big/tender-opportunities': '/about/customer-service/supplier-zone',
    '/about-big/thankstoyou-toolkit': '/funding/funding-guidance/thankstoyou-toolkit',
    '/about/uks-largest-community-funder-to-change-name': '/news/press-releases/2018-09-28/uks-largest-community-funder-to-change-name',
    '/blog/2018-10-26/our-new-digital-fund': '/news/blog/2018-10-26/our-new-digital-fund',
    '/blog/2018-11-15/place-based-funding': '/news/blog/2018-11-15/place-based-funding',
    '/blog/2018-11-16/a-young-persons-perspective-on-social-action': '/news/blog/2018-11-16/a-young-persons-perspective-on-social-action',
    '/blog/authors/jenny-raw': '/news/blog?author=jenny-raw',
    '/blog/authors/julia-parnaby': '/news/blog?author=julia-parnaby',
    '/blog/authors/tom-steinberg': '/news/blog?author=tom-steinberg',
    '/blog/digital': '/news/blog?category=digital',
    '/blog/insight': '/news/blog?category=insight',
    '/blog/tags/digital-fund': '/news/blog?tag=digital-fund',
    '/blog/tags/place-based-funding': '/news/blog?tag=place-based-funding',
    '/funding/awards-for-all': '/funding/under10k',
    '/funding/Awards-For-All': '/funding/under10k',
    '/funding/funding-guidance': '/funding',
    '/funding/funding-guidance/applying-for-funding': '/funding',
    '/funding/funding-guidance/applying-for-funding/full-cost-recovery': '/funding/funding-guidance/full-cost-recovery',
    '/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms': '/funding-guidance/help-using-our-application-forms',
    '/funding/funding-guidance/applying-for-funding/information-checks': '/funding/funding-guidance/information-checks',
    '/funding/funding-guidance/managing-your-funding/evaluation': '/funding/funding-guidance/evaluation',
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/help-with-publicity': '/funding/funding-guidance/managing-your-funding',
    '/funding/funding-guidance/managing-your-funding/logodownloads': '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    '/funding/funding-guidance/managing-your-funding/monitoring-forms': '/funding/funding-guidance/monitoring-forms',
    '/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales': '/funding/funding-guidance/managing-your-funding/ordering-free-materials',
    '/funding/funding-guidance/managing-your-funding/self-evaluation': '/funding/funding-guidance/evaluation',
    '/funding/past-grants': '/funding/grants',
    '/funding/past-grants/search': '/funding/grants',
    '/funding/programmes/digital-funding': '/funding/programmes/digital-fund',
    '/funding/scotland-portfolio/three-approaches': '/funding/funding-guidance/three-approaches-scotland',
    '/funding/search-past-grants-alpha': '/funding/grants',
    '/funding/search-past-grants*': '/funding/grants',
    '/home/funding': '/funding',
    '/Home/Funding/Funding*Finder': '/funding/programmes',
    '/news-and-events/contact-press-team': '/contact#segment-4',
    '/research': '/insights',
    '/research/place-based-working': '/insights/place-based-working',
    '/research/youth-employment': '/insights/youth-employment',
    '/research/youth-serious-violence': '/insights/youth-serious-violence',
    '/scotland': '/funding/programmes?location=scotland',


    // Renamed funding programmes
    // (eg. the path slug has changed from legacy => new)
    '/global-content/programmes/england/awards-for-all-england': '/funding/programmes/national-lottery-awards-for-all-england',
    '/global-content/programmes/england/fulfilling-lives-a-better-start': '/funding/strategic-investments/a-better-start',
    '/global-content/programmes/england/fulfilling-lives-ageing-better': '/funding/strategic-investments/ageing-better',
    '/global-content/programmes/england/fulfilling-lives-headstart': '/funding/strategic-investments/headstart',
    '/global-content/programmes/england/multiple-and-complex-needs': '/funding/strategic-investments/multiple-needs',
    '/global-content/programmes/england/talent-match' : '/funding/strategic-investments/talent-match',
    '/global-content/programmes/scotland/awards-for-all-scotland': '/funding/programmes/national-lottery-awards-for-all-scotland',
    '/global-content/programmes/uk-wide/coastal-communities': '/funding/programmes/coastal-communities-fund',
    '/global-content/programmes/uk-wide/lottery-funding': '/funding/programmes/other-lottery-funders',
    '/global-content/programmes/uk-wide/uk-portfolio': '/funding/programmes/awards-from-the-uk-portfolio',
    '/global-content/programmes/wales/awards-for-all-wales': '/funding/programmes/national-lottery-awards-for-all-wales',
    '/global-content/programmes/wales/people-and-places': '/funding/programmes?min=10000&location=wales',
    '/global-content/programmes/wales/rural-programme-community-grants': '/funding/programmes/rural-programme',

    // BBO region redirects
    // these are difficult to make wildcards/patterns due to other BBO pages in the same path
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-resources': '/funding/programmes/building-better-opportunities/building-better-opportunities-resources',
    '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding': '/funding/programmes/building-better-opportunities/guide-to-delivering-european-funding',
    '/global-content/programmes/england/building-better-opportunities/black-country': '/funding/programmes/building-better-opportunities/black-country',
    '/global-content/programmes/england/building-better-opportunities/buckinghamshire': '/funding/programmes/building-better-opportunities/buckinghamshire',
    '/global-content/programmes/england/building-better-opportunities/cheshire-and-warrington': '/funding/programmes/building-better-opportunities/cheshire-and-warrington',
    '/global-content/programmes/england/building-better-opportunities/coast-to-capital': '/funding/programmes/building-better-opportunities/coast-to-capital',
    '/global-content/programmes/england/building-better-opportunities/cornwall-and-isles-of-scilly': '/funding/programmes/building-better-opportunities/cornwall-and-isles-of-scilly',
    '/global-content/programmes/england/building-better-opportunities/coventry-and-warwickshire': '/funding/programmes/building-better-opportunities/coventry-and-warwickshire',
    '/global-content/programmes/england/building-better-opportunities/cumbria': '/funding/programmes/building-better-opportunities/cumbria',
    '/global-content/programmes/england/building-better-opportunities/derby-derbyshire-nottingham-and-nottinghamshire': '/funding/programmes/building-better-opportunities/derby-derbyshire-nottingham-and-nottinghamshire',
    '/global-content/programmes/england/building-better-opportunities/dorset': '/funding/programmes/building-better-opportunities/dorset',
    '/global-content/programmes/england/building-better-opportunities/enterprise-m3': '/funding/programmes/building-better-opportunities/enterprise-m3',
    '/global-content/programmes/england/building-better-opportunities/gloucestershire': '/funding/programmes/building-better-opportunities/gloucestershire',
    '/global-content/programmes/england/building-better-opportunities/greater-cambridge-greater-peterborough': '/funding/programmes/building-better-opportunities/greater-cambridge-greater-peterborough',
    '/global-content/programmes/england/building-better-opportunities/greater-lincolnshire': '/funding/programmes/building-better-opportunities/greater-lincolnshire',
    '/global-content/programmes/england/building-better-opportunities/greater-manchester': '/funding/programmes/building-better-opportunities/greater-manchester',
    '/global-content/programmes/england/building-better-opportunities/heart-of-the-south-west': '/funding/programmes/building-better-opportunities/heart-of-the-south-west',
    '/global-content/programmes/england/building-better-opportunities/hertfordshire': '/funding/programmes/building-better-opportunities/hertfordshire',
    '/global-content/programmes/england/building-better-opportunities/humber': '/funding/programmes/building-better-opportunities/humber',
    '/global-content/programmes/england/building-better-opportunities/lancashire': '/funding/programmes/building-better-opportunities/lancashire',
    '/global-content/programmes/england/building-better-opportunities/leeds-city-region': '/funding/programmes/building-better-opportunities/leeds-city-region',
    '/global-content/programmes/england/building-better-opportunities/leicester-and-leicestershire': '/funding/programmes/building-better-opportunities/leicester-and-leicestershire',
    '/global-content/programmes/england/building-better-opportunities/liverpool-city-region': '/funding/programmes/building-better-opportunities/liverpool-city-region',
    '/global-content/programmes/england/building-better-opportunities/london': '/funding/programmes/building-better-opportunities/london',
    '/global-content/programmes/england/building-better-opportunities/new-anglia': '/funding/programmes/building-better-opportunities/new-anglia',
    '/global-content/programmes/england/building-better-opportunities/north-east': '/funding/programmes/building-better-opportunities/north-east',
    '/global-content/programmes/england/building-better-opportunities/northamptonshire': '/funding/programmes/building-better-opportunities/northamptonshire',
    '/global-content/programmes/england/building-better-opportunities/oxfordshire': '/funding/programmes/building-better-opportunities/oxfordshire',
    '/global-content/programmes/england/building-better-opportunities/sheffield-city-region': '/funding/programmes/building-better-opportunities/sheffield-city-region',
    '/global-content/programmes/england/building-better-opportunities/solent': '/funding/programmes/building-better-opportunities/solent',
    '/global-content/programmes/england/building-better-opportunities/south-east': '/funding/programmes/building-better-opportunities/south-east',
    '/global-content/programmes/england/building-better-opportunities/south-east-midlands': '/funding/programmes/building-better-opportunities/south-east-midlands',
    '/global-content/programmes/england/building-better-opportunities/stoke-on-trent-staffordshire': '/funding/programmes/building-better-opportunities/stoke-on-trent-staffordshire',
    '/global-content/programmes/england/building-better-opportunities/swindon-and-wiltshire': '/funding/programmes/building-better-opportunities/swindon-and-wiltshire',
    '/global-content/programmes/england/building-better-opportunities/tees-valley': '/funding/programmes/building-better-opportunities/tees-valley',
    '/global-content/programmes/england/building-better-opportunities/thames-valley-berkshire': '/funding/programmes/building-better-opportunities/thames-valley-berkshire',
    '/global-content/programmes/england/building-better-opportunities/the-marches': '/funding/programmes/building-better-opportunities/the-marches',
    '/global-content/programmes/england/building-better-opportunities/west-of-england': '/funding/programmes/building-better-opportunities/west-of-england',
    '/global-content/programmes/england/building-better-opportunities/worcestershire': '/funding/programmes/building-better-opportunities/worcestershire',
    '/global-content/programmes/england/building-better-opportunities/york-north-yorkshire-and-east-riding': '/funding/programmes/building-better-opportunities/york-north-yorkshire-and-east-riding',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies': '/funding/programmes/building-better-opportunities/case-studies',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/samara_latit_gem': '/funding/programmes/building-better-opportunities/case-studies/samara-latit-gem',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/june_durham_gem': '/funding/programmes/building-better-opportunities/case-studies/june-durham',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/belinda_lets_get_working': '/funding/programmes/building-better-opportunities/case-studies/lets-get-working',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/gurmeet_bridges': '/funding/programmes/building-better-opportunities/case-studies/gurmeet-bridges',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/simon_boguszewicz_bridges': '/funding/programmes/building-better-opportunities/case-studies/simon-boguszewicz',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/manjeet_kaur_bridges': '/funding/programmes/building-better-opportunities/case-studies/manjeet-kaur',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/steve_thorpe_bridges': '/funding/programmes/building-better-opportunities/case-studies/steve-thorpe',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/colin_maycock_accelerate': '/funding/programmes/building-better-opportunities/case-studies/colin-maycock',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/nitesh_vadgama_chep': '/funding/programmes/building-better-opportunities/case-studies/nitesh-vadgama',

};

/**
 * Map aliases into an array with all legacy country sections prefixed
 * @type {Array<{ from: string, to: string }>}
 */
module.exports = flatMap(aliases, (to, from) => {
    const prefixes = ['', '/england', '/scotland', '/northernireland', '/wales'];
    return flatMap(prefixes, prefix => {
        const withPrefix = `${prefix}${from}`;
        const enRedirect = { from: withPrefix, to: to };
        const cyRedirect = { from: makeWelsh(withPrefix), to: makeWelsh(to) };
        return [enRedirect, cyRedirect];
    });
});
