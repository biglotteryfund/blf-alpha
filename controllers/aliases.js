'use strict';
const flatMap = require('lodash/flatMap');
const flatten = require('lodash/flatten');
const uniqBy = require('lodash/fp/uniqBy');
const { makeWelsh } = require('../common/urls');

/**
 * The previous biglotteryfund.org.uk website duplicated content
 * under country specific paths. For any urls that existed on
 * the old website that we want to redirect we need to make sure
 * we handle each variant. This method allows us to mark an alias
 * as needing these extra redirects.
 */
function withRegionPrefixes(alias) {
    const prefixes = [
        '',
        '/england',
        '/scotland',
        '/northernireland',
        '/wales',
    ];

    return prefixes.map((prefix) => {
        return { from: `${prefix}${alias.from}`, to: alias.to };
    });
}

/**
 * Create full list of aliases
 * Takes list of urls and duplicates them with a corresponding /welsh redirect
 */
function createAliases(aliases) {
    return flatMap(uniqBy((alias) => alias.from)(flatten(aliases)), (alias) => {
        return [
            alias,
            { from: makeWelsh(alias.from), to: makeWelsh(alias.to) },
        ];
    });
}

module.exports = createAliases([
    withRegionPrefixes({
        from: `/home/funding`,
        to: `/funding`,
    }),
    withRegionPrefixes({
        from: `/Home/Funding/Funding*Finder`,
        to: `/funding/programmes`,
    }),
    {
        from: `/scotland`,
        to: `/funding/programmes?location=scotland`,
    },
    withRegionPrefixes({
        from: `/about-big/contact-us`,
        to: `/about`,
    }),
    withRegionPrefixes({
        from: `/about-big/countries/about-england/strategic-investments-in-england`,
        to: `/funding/strategic-investments`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service`,
        to: `/about`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/bogus-lottery-emails`,
        to: `/about/customer-service/bogus-lottery-emails`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/cookies`,
        to: `/about/customer-service/cookies`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/customer-feedback`,
        to: `/about/customer-service/customer-feedback`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/data-protection`,
        to: `/about/customer-service/data-protection`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/fraud`,
        to: `/contact#segment-6`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/freedom-of-information`,
        to: `/about/customer-service/freedom-of-information`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/making-a-complaint`,
        to: `/contact#segment-5`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/privacy-policy`,
        to: `/about/customer-service/privacy-policy`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/terms-of-use`,
        to: `/about/customer-service/terms-of-use`,
    }),
    withRegionPrefixes({
        from: `/about-big/customer-service/welsh-language-scheme`,
        to: `/about/customer-service/welsh-language-scheme`,
    }),
    withRegionPrefixes({
        from: `/about-big/dormant-account-statement-of-intent`,
        to: `/funding/funding-guidance/dormant-account-statement-of-intent`,
    }),
    withRegionPrefixes({
        from: `/about-big/dormant-accounts-financial-inclusion-statement-of-intent`,
        to: `/funding/funding-guidance/dormant-accounts-financial-inclusion-statement-of-intent`,
    }),
    withRegionPrefixes({
        from: `/about-big/ebulletin-subscription`,
        to: `/about/ebulletin`,
    }),
    withRegionPrefixes({
        from: `/about-big/ebulletin`,
        to: `/about/ebulletin`,
    }),
    withRegionPrefixes({
        from: `/about-big/helping-millions-change-their-lives`,
        to: `/about/strategic-framework`,
    }),
    withRegionPrefixes({
        from: `/about-big/iwill`,
        to: `/funding/programmes/iwill-fund`,
    }),
    withRegionPrefixes({
        from: `/about-big/jobs`,
        to: `/jobs`,
    }),
    withRegionPrefixes({
        from: `/about-big/jobs/benefits`,
        to: `/jobs/benefits`,
    }),
    withRegionPrefixes({
        from: `/about-big/jobs/current-vacancies`,
        to: `/jobs`,
    }),
    withRegionPrefixes({
        from: `/about-big/jobs/how-to-apply`,
        to: `/jobs`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach`,
        to: `/about`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/about-big-lottery-fund`,
        to: `/about`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/accessibility`,
        to: `/about/customer-service/accessibility`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/equalities`,
        to: `/about/customer-service/equalities`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/equalities/learn-about-equality`,
        to: `/about/customer-service/equalities`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/equalities/northern-ireland-equality`,
        to: `/about/customer-service/northern-ireland-equality`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/international-funding`,
        to: `/funding/funding-guidance/international-funding`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-approach/non-lotttery-funding`,
        to: `/funding/funding-guidance/non-lottery-funding`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/`,
        to: `/about/our-people/`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/board`,
        to: `/about/our-people/board`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/england-committee-members`,
        to: `/about/our-people/england-committee`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/northern-ireland-committee-members`,
        to: `/about/our-people/northern-ireland-committee`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/scotland-committee-members`,
        to: `/about/our-people/scotland-committee`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/senior-management-team`,
        to: `/about/our-people/senior-management-team`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/uk-funding-committee`,
        to: `/about/our-people/uk-funding-committee`,
    }),
    withRegionPrefixes({
        from: `/about-big/our-people/wales-committee-members`,
        to: `/about/our-people/wales-committee`,
    }),
    withRegionPrefixes({
        from: `/about-big/publications/corporate-documents`,
        to: `/about/customer-service/corporate-documents`,
    }),
    withRegionPrefixes({
        from: `/about-big/strategic-framework`,
        to: `/about/strategic-framework`,
    }),
    withRegionPrefixes({
        from: `/about-big/strategic-framework/our-vision`,
        to: `/about/strategic-framework`,
    }),
    withRegionPrefixes({
        from: `/about-big/tender-opportunities`,
        to: `/about/customer-service/supplier-zone`,
    }),
    withRegionPrefixes({
        from: `/about-big/thankstoyou-toolkit`,
        to: `/funding/funding-guidance/thankstoyou-toolkit`,
    }),
    withRegionPrefixes({
        from: `/about/uks-largest-community-funder-to-change-name`,
        to: `/news/press-releases/2018-09-28/uks-largest-community-funder-to-change-name`,
    }),
    withRegionPrefixes({
        from: `/news-and-events/contact-press-team`,
        to: `/contact#segment-4`,
    }),
    {
        from: `/blog/2018-10-26/our-new-digital-fund`,
        to: `/news/blog/2018-10-26/our-new-digital-fund`,
    },
    {
        from: `/blog/2018-11-15/place-based-funding`,
        to: `/news/blog/2018-11-15/place-based-funding`,
    },
    {
        from: `/blog/2018-11-16/a-young-persons-perspective-on-social-action`,
        to: `/news/blog/2018-11-16/a-young-persons-perspective-on-social-action`,
    },
    {
        from: `/blog/authors/jenny-raw`,
        to: `/news/blog?author=jenny-raw`,
    },
    {
        from: `/blog/authors/julia-parnaby`,
        to: `/news/blog?author=julia-parnaby`,
    },
    {
        from: `/blog/authors/tom-steinberg`,
        to: `/news/blog?author=tom-steinberg`,
    },
    {
        from: `/blog/digital`,
        to: `/news/blog?category=digital`,
    },
    {
        from: `/blog/insight`,
        to: `/news/blog?category=insight`,
    },
    {
        from: `/blog/tags/digital-fund`,
        to: `/news/blog?tag=digital-fund`,
    },
    {
        from: `/blog/tags/place-based-funding`,
        to: `/news/blog?tag=place-based-funding`,
    },
    withRegionPrefixes({
        from: `/research`,
        to: `/insights`,
    }),
    withRegionPrefixes({
        from: `/research/place-based-working`,
        to: `/insights/place-based-working`,
    }),
    withRegionPrefixes({
        from: `/research/youth-employment`,
        to: `/insights/youth-employment`,
    }),
    withRegionPrefixes({
        from: `/research/youth-serious-violence`,
        to: `/insights/youth-serious-violence`,
    }),
    withRegionPrefixes({
        from: `/research/social-investment/publications`,
        to: `/insights/social-investment-publications`,
    }),
    withRegionPrefixes({
        from: `/funding/awards-for-all`,
        to: `/funding/under10k`,
    }),
    withRegionPrefixes({
        from: `/funding/Awards-For-All`,
        to: `/funding/under10k`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-finder?sc=1`,
        to: `/funding/programmes/all`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding`,
        to: `/funding/managing-your-grant/promoting-your-project`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/social-media`,
        to: `/funding/managing-your-grant/promoting-your-project/social-media`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/press`,
        to: `/funding/managing-your-grant/promoting-your-project/your-local-press`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/ordering-free-materials`,
        to: `/funding/managing-your-grant/promoting-your-project/order-free-materials`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/data-and-evidence`,
        to: `/funding/managing-your-grant/gathering-evidence-and-learning/data-and-evidence`,
    }),
    withRegionPrefixes({
        from: `/funding/under10k/managing-your-grant`,
        to: `/funding/managing-your-grant/under-10k`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance`,
        to: `/funding`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/applying-for-funding`,
        to: `/funding`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/applying-for-funding/full-cost-recovery`,
        to: `/funding/funding-guidance/full-cost-recovery`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms`,
        to: `/funding-guidance/help-using-our-application-forms`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/applying-for-funding/information-checks`,
        to: `/funding/funding-guidance/information-checks`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/evaluation`,
        to: `/funding/managing-your-grant/gathering-evidence-and-learning`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/evaluation`,
        to: `/funding/managing-your-grant/gathering-evidence-and-learning`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/help-with-publicity`,
        to: `/funding/managing-your-grant/promoting-your-project`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/logodownloads`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales`,
        to: `/funding/managing-your-grant/promoting-your-project/order-free-materials`,
    }),
    withRegionPrefixes({
        from: `/funding/funding-guidance/managing-your-funding/self-evaluation`,
        to: `/funding/funding-guidance/evaluation`,
    }),
    withRegionPrefixes({
        from: `/funding/past-grants`,
        to: `/funding/grants`,
    }),
    withRegionPrefixes({
        from: `/funding/past-grants/search`,
        to: `/funding/grants`,
    }),
    withRegionPrefixes({
        from: `/funding/programmes/digital-funding`,
        to: `/funding/programmes/digital-fund`,
    }),
    withRegionPrefixes({
        from: `/funding/scotland-portfolio/three-approaches`,
        to: `/funding/funding-guidance/three-approaches-scotland`,
    }),
    withRegionPrefixes({
        from: `/funding/search-past-grants-alpha`,
        to: `/funding/grants`,
    }),
    withRegionPrefixes({
        from: `/funding/search-past-grants*`,
        to: `/funding/grants`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/awards-for-all-england`,
        to: `/funding/programmes/national-lottery-awards-for-all-england`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/awards-for-all-england/a4alightpilotintro`,
        to: `/funding/programmes/national-lottery-awards-for-all-england`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/black-country`,
        to: `/funding/programmes/building-better-opportunities/black-country`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/buckinghamshire`,
        to: `/funding/programmes/building-better-opportunities/buckinghamshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies`,
        to: `/funding/programmes/building-better-opportunities/case-studies`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/belinda_lets_get_working`,
        to: `/funding/programmes/building-better-opportunities/case-studies/lets-get-working`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/colin_maycock_accelerate`,
        to: `/funding/programmes/building-better-opportunities/case-studies/colin-maycock`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/gurmeet_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/gurmeet-bridges`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/june_durham_gem`,
        to: `/funding/programmes/building-better-opportunities/case-studies/june-durham`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/manjeet_kaur_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/manjeet-kaur`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/nitesh_vadgama_chep`,
        to: `/funding/programmes/building-better-opportunities/case-studies/nitesh-vadgama`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/samara_latit_gem`,
        to: `/funding/programmes/building-better-opportunities/case-studies/samara-latit-gem`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/simon_boguszewicz_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/simon-boguszewicz`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/steve_thorpe_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/steve-thorpe`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-resources`,
        to: `/funding/programmes/building-better-opportunities/building-better-opportunities-resources`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/cheshire-and-warrington`,
        to: `/funding/programmes/building-better-opportunities/cheshire-and-warrington`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/coast-to-capital`,
        to: `/funding/programmes/building-better-opportunities/coast-to-capital`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/cornwall-and-isles-of-scilly`,
        to: `/funding/programmes/building-better-opportunities/cornwall-and-isles-of-scilly`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/coventry-and-warwickshire`,
        to: `/funding/programmes/building-better-opportunities/coventry-and-warwickshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/cumbria`,
        to: `/funding/programmes/building-better-opportunities/cumbria`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/derby-derbyshire-nottingham-and-nottinghamshire`,
        to: `/funding/programmes/building-better-opportunities/derby-derbyshire-nottingham-and-nottinghamshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/dorset`,
        to: `/funding/programmes/building-better-opportunities/dorset`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/enterprise-m3`,
        to: `/funding/programmes/building-better-opportunities/enterprise-m3`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/gloucestershire`,
        to: `/funding/programmes/building-better-opportunities/gloucestershire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/greater-cambridge-greater-peterborough`,
        to: `/funding/programmes/building-better-opportunities/greater-cambridge-greater-peterborough`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/greater-lincolnshire`,
        to: `/funding/programmes/building-better-opportunities/greater-lincolnshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/greater-manchester`,
        to: `/funding/programmes/building-better-opportunities/greater-manchester`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding`,
        to: `/funding/programmes/building-better-opportunities/guide-to-delivering-european-funding`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/heart-of-the-south-west`,
        to: `/funding/programmes/building-better-opportunities/heart-of-the-south-west`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/hertfordshire`,
        to: `/funding/programmes/building-better-opportunities/hertfordshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/humber`,
        to: `/funding/programmes/building-better-opportunities/humber`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/lancashire`,
        to: `/funding/programmes/building-better-opportunities/lancashire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/leeds-city-region`,
        to: `/funding/programmes/building-better-opportunities/leeds-city-region`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/leicester-and-leicestershire`,
        to: `/funding/programmes/building-better-opportunities/leicester-and-leicestershire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/liverpool-city-region`,
        to: `/funding/programmes/building-better-opportunities/liverpool-city-region`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/london`,
        to: `/funding/programmes/building-better-opportunities/london`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/new-anglia`,
        to: `/funding/programmes/building-better-opportunities/new-anglia`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/north-east`,
        to: `/funding/programmes/building-better-opportunities/north-east`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/northamptonshire`,
        to: `/funding/programmes/building-better-opportunities/northamptonshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/oxfordshire`,
        to: `/funding/programmes/building-better-opportunities/oxfordshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/sheffield-city-region`,
        to: `/funding/programmes/building-better-opportunities/sheffield-city-region`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/solent`,
        to: `/funding/programmes/building-better-opportunities/solent`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/south-east-midlands`,
        to: `/funding/programmes/building-better-opportunities/south-east-midlands`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/south-east`,
        to: `/funding/programmes/building-better-opportunities/south-east`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/stoke-on-trent-staffordshire`,
        to: `/funding/programmes/building-better-opportunities/stoke-on-trent-staffordshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/swindon-and-wiltshire`,
        to: `/funding/programmes/building-better-opportunities/swindon-and-wiltshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/tees-valley`,
        to: `/funding/programmes/building-better-opportunities/tees-valley`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/thames-valley-berkshire`,
        to: `/funding/programmes/building-better-opportunities/thames-valley-berkshire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/the-marches`,
        to: `/funding/programmes/building-better-opportunities/the-marches`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/west-of-england`,
        to: `/funding/programmes/building-better-opportunities/west-of-england`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/worcestershire`,
        to: `/funding/programmes/building-better-opportunities/worcestershire`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/building-better-opportunities/york-north-yorkshire-and-east-riding`,
        to: `/funding/programmes/building-better-opportunities/york-north-yorkshire-and-east-riding`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/fulfilling-lives-a-better-start`,
        to: `/funding/strategic-investments/a-better-start`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/fulfilling-lives-ageing-better`,
        to: `/funding/strategic-investments/ageing-better`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/fulfilling-lives-headstart`,
        to: `/funding/strategic-investments/headstart`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/multiple-and-complex-needs`,
        to: `/funding/strategic-investments/multiple-needs`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/england/talent-match`,
        to: `/funding/strategic-investments/talent-match`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/scotland/awards-for-all-scotland`,
        to: `/funding/programmes/national-lottery-awards-for-all-scotland`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/uk-wide/coastal-communities`,
        to: `/funding/programmes/coastal-communities-fund`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/uk-wide/lottery-funding`,
        to: `/funding/programmes/other-lottery-funders`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/uk-wide/uk-portfolio`,
        to: `/funding/programmes/awards-from-the-uk-portfolio`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/wales/awards-for-all-wales`,
        to: `/funding/programmes/national-lottery-awards-for-all-wales`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/wales/people-and-places`,
        to: `/funding/programmes?min=10000&location=wales`,
    }),
    withRegionPrefixes({
        from: `/global-content/programmes/wales/rural-programme-community-grants`,
        to: `/funding/programmes/rural-programme`,
    }),
    withRegionPrefixes({
        from: `/contact-us`,
        to: `/contact`,
    }),
    withRegionPrefixes({
        from: `/news-and-events`,
        to: `/news`,
    }),
    withRegionPrefixes({
        from: `/research/open-data`,
        to: `/data#open-data`,
    }),
    {
        from: `/about/customer-service/supplier-zone/contracts-finder`,
        to: `/about/customer-service/supplier-zone`,
    },
    {
        from: `/-/media/Images/Logos/JPEGs/hi_big_e_min_blue.jpg`,
        to: `/assets/images/logos/tnlcf/monolingual/colour.png`,
    },
    {
        from: `/-/media/Images/Logos/JPEGs/hi_big_e_min_pink.jpg`,
        to: `/assets/images/logos/tnlcf/monolingual/colour.png`,
    },
    {
        from: `/news/press-releases/2019-07-18/100-million-national-lottery-climate-action-fund-launched-for-communities-across-the-uk`,
        to: `/news/press-releases/2019-07-18/100million-national-lottery-climate-action-fund-launched-for-communities-across-the-uk`,
    },
    {
        from: '/funding/programmes/coastal-communities-fund-1',
        to: '/funding/programmes/coastal-communities-fund',
    },
]);
