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

function buildHomepageHero() {
    const heroImageDefault = createHeroImage({
        small: 'home/home-hero-4-small.jpg',
        medium: 'home/home-hero-4-medium.jpg',
        large: 'home/home-hero-4-large.jpg',
        default: 'home/home-hero-4-medium.jpg',
        caption: 'Somewhereto, Grant £7m'
    });

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

module.exports = {
    createHeroImage: createHeroImage,
    heroImages: {
        homepageHero: buildHomepageHero()
    }
};
