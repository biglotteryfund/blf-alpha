'use strict';
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
    huntingtonsProject: createHeroImage({
        small: 'hero/huntingtons-project-small.jpg',
        medium: 'hero/huntingtons-project-medium.jpg',
        large: 'hero/huntingtons-project-large.jpg',
        default: 'hero/huntingtons-project-medium.jpg',
        caption: 'Huntingtons Project'
    }),
    rathlinIslandDevelopment: createHeroImage({
        small: 'hero/rathlin-island-development-small.jpg',
        medium: 'hero/rathlin-island-development-medium.jpg',
        large: 'hero/rathlin-island-development-large.jpg',
        default: 'hero/rathlin-island-development-medium.jpg',
        caption: 'Rathlin Island Development and Community Association'
    }),
    streetDreams: createHeroImage({
        small: 'hero/street-dreams-small.jpg',
        medium: 'hero/street-dreams-medium.jpg',
        large: 'hero/street-dreams-large.jpg',
        default: 'hero/street-dreams-medium.jpg',
        caption: 'Street Dreams, Grant £9,000'
    }),
    youngFoundation: createHeroImage({
        small: 'hero/young-foundation-small.jpg',
        medium: 'hero/young-foundation-medium.jpg',
        large: 'hero/young-foundation-large.jpg',
        default: 'hero/young-foundation-medium.jpg',
        caption: 'The Young Foundation - Amplify, Grant £1.06M'
    }),
    youngShoulders: createHeroImage({
        small: 'hero/cancer-fund-for-children-small.jpg',
        medium: 'hero/cancer-fund-for-children-medium.jpg',
        large: 'hero/cancer-fund-for-children-large.jpg',
        default: 'hero/cancer-fund-for-children-medium.jpg',
        caption: 'Young Shoulders Programme'
    })
};

const superHeroImages = {
    steppingStones: createHeroImage({
        small: 'super-hero/stepping-stones-small.jpg',
        medium: 'super-hero/stepping-stones-medium.jpg',
        large: 'super-hero/stepping-stones-large.jpg',
        default: 'super-hero/stepping-stones-medium.jpg',
        caption: 'Stepping Stones Programme, Grant £405,270'
    })
};

const defaultHeroImage = heroImages.rathlinIslandDevelopment;

const withFallbackImage = heroImage => heroImage || defaultHeroImage;

module.exports = {
    heroImages,
    superHeroImages,
    defaultHeroImage,
    createHeroImage,
    withFallbackImage
};
