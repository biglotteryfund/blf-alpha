const { has } = require('lodash');
const assets = require('./assets');

function createHeroImage(opts) {
    if (!['small', 'medium', 'large'].every(x => has(opts, x))) {
        throw new Error('Must pass a small, medium, and large image');
    }

    if (!has(opts, 'default')) {
        throw new Error('Must define a default image with opts.default');
    }

    return {
        small: assets.getImagePath(opts.small),
        medium: assets.getImagePath(opts.medium),
        large: assets.getImagePath(opts.large),
        default: assets.getImagePath(opts.default),
        caption: opts.caption || ''
    };
}

const heroImages = {
    mentalHealthFoundation: createHeroImage({
        small: 'hero/mental-health-foundation-small.jpg',
        medium: 'hero/mental-health-foundation-medium.jpg',
        large: 'hero/mental-health-foundation-large.jpg',
        default: 'hero/mental-health-foundation-medium.jpg',
        caption: 'Mental Health Foundation'
    }),
    streetDreams: createHeroImage({
        small: 'hero/jobs-small.jpg',
        medium: 'hero/jobs-medium.jpg',
        large: 'hero/jobs-large.jpg',
        default: 'hero/jobs-medium.jpg',
        caption: 'Street Dreams, Grant £9,000'
    }),
    rathlinIslandDevelopment: createHeroImage({
        small: 'hero/rathlin-island-development-small.jpg',
        medium: 'hero/rathlin-island-development-medium.jpg',
        large: 'hero/rathlin-island-development-large.jpg',
        default: 'hero/rathlin-island-development-medium.jpg',
        caption: 'Rathlin Island Development and Community Association'
    })
};

function buildHomepageHero() {
    const heroImageDefault = heroImages.streetDreams;
    const heroImageCandidates = [
        createHeroImage({
            small: 'home/home-hero-1-small.jpg',
            medium: 'home/home-hero-1-medium.jpg',
            large: 'home/home-hero-1-large.jpg',
            default: 'home/home-hero-1-medium.jpg',
            caption: 'Cycling for All in Bolsover, Grant £9,358 *'
        }),
        createHeroImage({
            small: 'home/home-hero-2-small.jpg',
            medium: 'home/home-hero-2-medium.jpg',
            large: 'home/home-hero-2-large.jpg',
            default: 'home/home-hero-2-medium.jpg',
            caption: 'Stepping Stones Programme, Grant £405,270'
        }),
        createHeroImage({
            small: 'home/home-hero-3-small.jpg',
            medium: 'home/home-hero-3-medium.jpg',
            large: 'home/home-hero-3-large.jpg',
            default: 'home/home-hero-3-medium.jpg',
            caption: 'Cloughmills Community Action, Grant £4,975*'
        }),
        heroImageDefault
    ];

    return {
        default: heroImageDefault,
        candidates: heroImageCandidates
    };
}

/**
 * Allow for pages without heroes
 * @TODO: Define better default hero image.
 */
const withFallbackImage = heroImage => heroImage || heroImages.streetDreams;

module.exports = {
    createHeroImage,
    heroImages: heroImages,
    homepageHero: buildHomepageHero(),
    withFallbackImage
};
