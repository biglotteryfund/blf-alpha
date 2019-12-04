'use strict';
const { flatMap, uniqBy } = require('lodash');
const { makeWelsh } = require('../common/urls');

function createAliases(aliases) {
    const uniqueAliases = uniqBy(aliases, alias => alias.from);

    const prefixedAliases = flatMap(uniqueAliases, alias => {
        const regionPrefixes = [
            '',
            '/england',
            '/scotland',
            '/northernireland',
            '/wales'
        ];

        if (alias.includeRegionPrefixes) {
            return regionPrefixes.map(prefix => {
                const withPrefix = `${prefix}${alias.from}`;
                return { from: withPrefix, to: alias.to };
            });
        } else {
            return { from: alias.from, to: alias.to };
        }
    });

    return flatMap(prefixedAliases, alias => {
        return [
            alias,
            { from: makeWelsh(alias.from), to: makeWelsh(alias.to) }
        ];
    });
}

module.exports = createAliases([
    {
        from: `/home/funding`,
        to: `/funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/Home/Funding/Funding*Finder`,
        to: `/funding/programmes`,
        includeRegionPrefixes: true
    },
    {
        from: `/scotland`,
        to: `/funding/programmes?location=scotland`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/contact-us`,
        to: `/about`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/countries/about-england/strategic-investments-in-england`,
        to: `/funding/strategic-investments`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service`,
        to: `/about`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/bogus-lottery-emails`,
        to: `/about/customer-service/bogus-lottery-emails`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/cookies`,
        to: `/about/customer-service/cookies`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/customer-feedback`,
        to: `/about/customer-service/customer-feedback`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/data-protection`,
        to: `/about/customer-service/data-protection`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/fraud`,
        to: `/contact#segment-6`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/freedom-of-information`,
        to: `/about/customer-service/freedom-of-information`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/making-a-complaint`,
        to: `/contact#segment-5`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/privacy-policy`,
        to: `/about/customer-service/privacy-policy`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/terms-of-use`,
        to: `/about/customer-service/terms-of-use`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/customer-service/welsh-language-scheme`,
        to: `/about/customer-service/welsh-language-scheme`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/dormant-account-statement-of-intent`,
        to: `/funding/funding-guidance/dormant-account-statement-of-intent`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/dormant-accounts-financial-inclusion-statement-of-intent`,
        to: `/funding/funding-guidance/dormant-accounts-financial-inclusion-statement-of-intent`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/ebulletin-subscription`,
        to: `/about/ebulletin`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/ebulletin`,
        to: `/about/ebulletin`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/helping-millions-change-their-lives`,
        to: `/about/strategic-framework`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/iwill`,
        to: `/funding/programmes/iwill-fund`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/jobs`,
        to: `/jobs`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/jobs/benefits`,
        to: `/jobs/benefits`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/jobs/current-vacancies`,
        to: `/jobs`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/jobs/how-to-apply`,
        to: `/jobs`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach`,
        to: `/about`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/about-big-lottery-fund`,
        to: `/about`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/accessibility`,
        to: `/about/customer-service/accessibility`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/equalities`,
        to: `/about/customer-service/equalities`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/equalities/learn-about-equality`,
        to: `/about/customer-service/equalities`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/equalities/northern-ireland-equality`,
        to: `/about/customer-service/northern-ireland-equality`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/international-funding`,
        to: `/funding/funding-guidance/international-funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-approach/non-lotttery-funding`,
        to: `/funding/funding-guidance/non-lottery-funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/`,
        to: `/about/our-people/`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/board`,
        to: `/about/our-people/board`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/england-committee-members`,
        to: `/about/our-people/england-committee`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/northern-ireland-committee-members`,
        to: `/about/our-people/northern-ireland-committee`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/scotland-committee-members`,
        to: `/about/our-people/scotland-committee`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/senior-management-team`,
        to: `/about/our-people/senior-management-team`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/uk-funding-committee`,
        to: `/about/our-people/uk-funding-committee`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/our-people/wales-committee-members`,
        to: `/about/our-people/wales-committee`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/publications/corporate-documents`,
        to: `/about/customer-service/corporate-documents`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/strategic-framework`,
        to: `/about/strategic-framework`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/strategic-framework/our-vision`,
        to: `/about/strategic-framework`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/tender-opportunities`,
        to: `/about/customer-service/supplier-zone`,
        includeRegionPrefixes: true
    },
    {
        from: `/about-big/thankstoyou-toolkit`,
        to: `/funding/funding-guidance/thankstoyou-toolkit`,
        includeRegionPrefixes: true
    },
    {
        from: `/about/uks-largest-community-funder-to-change-name`,
        to: `/news/press-releases/2018-09-28/uks-largest-community-funder-to-change-name`,
        includeRegionPrefixes: true
    },
    {
        from: `/news-and-events/contact-press-team`,
        to: `/contact#segment-4`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/2018-10-26/our-new-digital-fund`,
        to: `/news/blog/2018-10-26/our-new-digital-fund`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/2018-11-15/place-based-funding`,
        to: `/news/blog/2018-11-15/place-based-funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/2018-11-16/a-young-persons-perspective-on-social-action`,
        to: `/news/blog/2018-11-16/a-young-persons-perspective-on-social-action`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/authors/jenny-raw`,
        to: `/news/blog?author=jenny-raw`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/authors/julia-parnaby`,
        to: `/news/blog?author=julia-parnaby`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/authors/tom-steinberg`,
        to: `/news/blog?author=tom-steinberg`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/digital`,
        to: `/news/blog?category=digital`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/insight`,
        to: `/news/blog?category=insight`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/tags/digital-fund`,
        to: `/news/blog?tag=digital-fund`,
        includeRegionPrefixes: true
    },
    {
        from: `/blog/tags/place-based-funding`,
        to: `/news/blog?tag=place-based-funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/research`,
        to: `/insights`,
        includeRegionPrefixes: true
    },
    {
        from: `/research/place-based-working`,
        to: `/insights/place-based-working`,
        includeRegionPrefixes: true
    },
    {
        from: `/research/youth-employment`,
        to: `/insights/youth-employment`,
        includeRegionPrefixes: true
    },
    {
        from: `/research/youth-serious-violence`,
        to: `/insights/youth-serious-violence`,
        includeRegionPrefixes: true
    },
    {
        from: `/research/social-investment/publications`,
        to: `/insights/social-investment-publications`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/awards-for-all`,
        to: `/funding/under10k`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/Awards-For-All`,
        to: `/funding/under10k`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-finder?sc=1`,
        to: `/funding/programmes/all`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding`,
        to: `/funding/managing-your-grant/promoting-your-project`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/social-media`,
        to: `/funding/managing-your-grant/promoting-your-project/social-media`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/press`,
        to: `/funding/managing-your-grant/promoting-your-project/your-local-press`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/ordering-free-materials`,
        to: `/funding/managing-your-grant/promoting-your-project/order-free-materials`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/data-and-evidence`,
        to: `/funding/managing-your-grant/gathering-evidence-and-learning/data-and-evidence`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/under10k/managing-your-grant`,
        to: `/funding/managing-your-grant/under-10k`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance`,
        to: `/funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/applying-for-funding`,
        to: `/funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/applying-for-funding/full-cost-recovery`,
        to: `/funding/funding-guidance/full-cost-recovery`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms`,
        to: `/funding-guidance/help-using-our-application-forms`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/applying-for-funding/information-checks`,
        to: `/funding/funding-guidance/information-checks`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/evaluation`,
        to: `/funding/funding-guidance/evaluation`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/help-with-publicity`,
        to: `/funding/managing-your-grant/promoting-your-project`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/logodownloads`,
        to: `/funding/managing-your-grant/promoting-your-project/download-our-logo`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales`,
        to: `/funding/managing-your-grant/promoting-your-project/order-free-materials`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/funding-guidance/managing-your-funding/self-evaluation`,
        to: `/funding/funding-guidance/evaluation`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/past-grants`,
        to: `/funding/grants`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/past-grants/search`,
        to: `/funding/grants`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/programmes/digital-funding`,
        to: `/funding/programmes/digital-fund`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/scotland-portfolio/three-approaches`,
        to: `/funding/funding-guidance/three-approaches-scotland`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/search-past-grants-alpha`,
        to: `/funding/grants`,
        includeRegionPrefixes: true
    },
    {
        from: `/funding/search-past-grants*`,
        to: `/funding/grants`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/awards-for-all-england`,
        to: `/funding/programmes/national-lottery-awards-for-all-england`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/awards-for-all-england/a4alightpilotintro`,
        to: `/funding/programmes/national-lottery-awards-for-all-england`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/black-country`,
        to: `/funding/programmes/building-better-opportunities/black-country`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/buckinghamshire`,
        to: `/funding/programmes/building-better-opportunities/buckinghamshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies`,
        to: `/funding/programmes/building-better-opportunities/case-studies`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/belinda_lets_get_working`,
        to: `/funding/programmes/building-better-opportunities/case-studies/lets-get-working`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/colin_maycock_accelerate`,
        to: `/funding/programmes/building-better-opportunities/case-studies/colin-maycock`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/gurmeet_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/gurmeet-bridges`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/june_durham_gem`,
        to: `/funding/programmes/building-better-opportunities/case-studies/june-durham`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/manjeet_kaur_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/manjeet-kaur`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/nitesh_vadgama_chep`,
        to: `/funding/programmes/building-better-opportunities/case-studies/nitesh-vadgama`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/samara_latit_gem`,
        to: `/funding/programmes/building-better-opportunities/case-studies/samara-latit-gem`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/simon_boguszewicz_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/simon-boguszewicz`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-case-studies/steve_thorpe_bridges`,
        to: `/funding/programmes/building-better-opportunities/case-studies/steve-thorpe`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/building-better-opportunities-resources`,
        to: `/funding/programmes/building-better-opportunities/building-better-opportunities-resources`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/cheshire-and-warrington`,
        to: `/funding/programmes/building-better-opportunities/cheshire-and-warrington`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/coast-to-capital`,
        to: `/funding/programmes/building-better-opportunities/coast-to-capital`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/cornwall-and-isles-of-scilly`,
        to: `/funding/programmes/building-better-opportunities/cornwall-and-isles-of-scilly`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/coventry-and-warwickshire`,
        to: `/funding/programmes/building-better-opportunities/coventry-and-warwickshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/cumbria`,
        to: `/funding/programmes/building-better-opportunities/cumbria`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/derby-derbyshire-nottingham-and-nottinghamshire`,
        to: `/funding/programmes/building-better-opportunities/derby-derbyshire-nottingham-and-nottinghamshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/dorset`,
        to: `/funding/programmes/building-better-opportunities/dorset`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/enterprise-m3`,
        to: `/funding/programmes/building-better-opportunities/enterprise-m3`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/gloucestershire`,
        to: `/funding/programmes/building-better-opportunities/gloucestershire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/greater-cambridge-greater-peterborough`,
        to: `/funding/programmes/building-better-opportunities/greater-cambridge-greater-peterborough`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/greater-lincolnshire`,
        to: `/funding/programmes/building-better-opportunities/greater-lincolnshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/greater-manchester`,
        to: `/funding/programmes/building-better-opportunities/greater-manchester`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding`,
        to: `/funding/programmes/building-better-opportunities/guide-to-delivering-european-funding`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/heart-of-the-south-west`,
        to: `/funding/programmes/building-better-opportunities/heart-of-the-south-west`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/hertfordshire`,
        to: `/funding/programmes/building-better-opportunities/hertfordshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/humber`,
        to: `/funding/programmes/building-better-opportunities/humber`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/lancashire`,
        to: `/funding/programmes/building-better-opportunities/lancashire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/leeds-city-region`,
        to: `/funding/programmes/building-better-opportunities/leeds-city-region`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/leicester-and-leicestershire`,
        to: `/funding/programmes/building-better-opportunities/leicester-and-leicestershire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/liverpool-city-region`,
        to: `/funding/programmes/building-better-opportunities/liverpool-city-region`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/london`,
        to: `/funding/programmes/building-better-opportunities/london`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/new-anglia`,
        to: `/funding/programmes/building-better-opportunities/new-anglia`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/north-east`,
        to: `/funding/programmes/building-better-opportunities/north-east`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/northamptonshire`,
        to: `/funding/programmes/building-better-opportunities/northamptonshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/oxfordshire`,
        to: `/funding/programmes/building-better-opportunities/oxfordshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/sheffield-city-region`,
        to: `/funding/programmes/building-better-opportunities/sheffield-city-region`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/solent`,
        to: `/funding/programmes/building-better-opportunities/solent`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/south-east-midlands`,
        to: `/funding/programmes/building-better-opportunities/south-east-midlands`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/south-east`,
        to: `/funding/programmes/building-better-opportunities/south-east`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/stoke-on-trent-staffordshire`,
        to: `/funding/programmes/building-better-opportunities/stoke-on-trent-staffordshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/swindon-and-wiltshire`,
        to: `/funding/programmes/building-better-opportunities/swindon-and-wiltshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/tees-valley`,
        to: `/funding/programmes/building-better-opportunities/tees-valley`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/thames-valley-berkshire`,
        to: `/funding/programmes/building-better-opportunities/thames-valley-berkshire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/the-marches`,
        to: `/funding/programmes/building-better-opportunities/the-marches`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/west-of-england`,
        to: `/funding/programmes/building-better-opportunities/west-of-england`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/worcestershire`,
        to: `/funding/programmes/building-better-opportunities/worcestershire`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/building-better-opportunities/york-north-yorkshire-and-east-riding`,
        to: `/funding/programmes/building-better-opportunities/york-north-yorkshire-and-east-riding`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/fulfilling-lives-a-better-start`,
        to: `/funding/strategic-investments/a-better-start`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/fulfilling-lives-ageing-better`,
        to: `/funding/strategic-investments/ageing-better`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/fulfilling-lives-headstart`,
        to: `/funding/strategic-investments/headstart`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/multiple-and-complex-needs`,
        to: `/funding/strategic-investments/multiple-needs`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/england/talent-match`,
        to: `/funding/strategic-investments/talent-match`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/scotland/awards-for-all-scotland`,
        to: `/funding/programmes/national-lottery-awards-for-all-scotland`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/uk-wide/coastal-communities`,
        to: `/funding/programmes/coastal-communities-fund`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/uk-wide/lottery-funding`,
        to: `/funding/programmes/other-lottery-funders`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/uk-wide/uk-portfolio`,
        to: `/funding/programmes/awards-from-the-uk-portfolio`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/wales/awards-for-all-wales`,
        to: `/funding/programmes/national-lottery-awards-for-all-wales`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/wales/people-and-places`,
        to: `/funding/programmes?min=10000&location=wales`,
        includeRegionPrefixes: true
    },
    {
        from: `/global-content/programmes/wales/rural-programme-community-grants`,
        to: `/funding/programmes/rural-programme`,
        includeRegionPrefixes: true
    },
    {
        from: `/contact-us`,
        to: `/contact`,
        includeRegionPrefixes: true
    },
    {
        from: `/news-and-events`,
        to: `/news`,
        includeRegionPrefixes: true
    },
    {
        from: `/research/open-data`,
        to: `/data#open-data`,
        includeRegionPrefixes: true
    },
    {
        from: `/about/customer-service/supplier-zone/contracts-finder`,
        to: `/about/customer-service/supplier-zone`,
        includeRegionPrefixes: true
    },
    {
        from: `/-/media/Images/Logos/JPEGs/hi_big_e_min_blue.jpg`,
        to: `/assets/images/logos/tnlcf/monolingual/colour.png`,
        includeRegionPrefixes: true
    },
    {
        from: `/-/media/Images/Logos/JPEGs/hi_big_e_min_pink.jpg`,
        to: `/assets/images/logos/tnlcf/monolingual/colour.png`,
        includeRegionPrefixes: true
    }
]);
