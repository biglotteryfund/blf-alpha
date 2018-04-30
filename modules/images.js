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
    centreForBetterHealthBakery: createHeroImage({
        small: 'hero/centre-for-better-health-bakery-small.jpg',
        medium: 'hero/centre-for-better-health-bakery-medium.jpg',
        large: 'hero/centre-for-better-health-bakery-large.jpg',
        default: 'hero/centre-for-better-health-bakery-medium.jpg',
        caption: 'Centre for Better Health Bakery'
    }),
    friendsOfGreenwich: createHeroImage({
        small: 'hero/friends-of-greenwich-small.jpg',
        medium: 'hero/friends-of-greenwich-medium.jpg',
        large: 'hero/friends-of-greenwich-large.jpg',
        default: 'hero/friends-of-greenwich-medium.jpg',
        caption: 'Friends of Greenwich Peninsula Ecology Park, Grant £5,350'
    }),
    huntingtonsProject: createHeroImage({
        small: 'hero/huntingtons-project-small.jpg',
        medium: 'hero/huntingtons-project-medium.jpg',
        large: 'hero/huntingtons-project-large.jpg',
        default: 'hero/huntingtons-project-medium.jpg',
        caption: 'Huntingtons Project'
    }),
    larcheBelfast: createHeroImage({
        small: 'hero/larche-belfast-small.jpg',
        medium: 'hero/larche-belfast-medium.jpg',
        large: 'hero/larche-belfast-large.jpg',
        default: 'hero/larche-belfast-medium.jpg',
        caption: "L'Arche Belfast, Grant: £573,164"
    }),
    newRoutesIntoHorseCare: createHeroImage({
        small: 'hero/new-routes-into-horse-care-small.jpg',
        medium: 'hero/new-routes-into-horse-care-medium.jpg',
        large: 'hero/new-routes-into-horse-care-large.jpg',
        default: 'hero/new-routes-into-horse-care-medium.jpg',
        caption: 'New Routes into Horse Care'
    }),
    oasisCaringInAction: createHeroImage({
        small: 'hero/oasis-caring-in-action-antrim-youthways-small.jpg',
        medium: 'hero/oasis-caring-in-action-antrim-youthways-medium.jpg',
        large: 'hero/oasis-caring-in-action-antrim-youthways-large.jpg',
        default: 'hero/oasis-caring-in-action-antrim-youthways-medium.jpg',
        caption: 'Oasis Caring in Action Antrim Youthways'
    }),
    passion4Fusion: createHeroImage({
        small: 'hero/passion4fusion-small.jpg',
        medium: 'hero/passion4fusion-medium.jpg',
        large: 'hero/passion4fusion-large.jpg',
        default: 'hero/passion4fusion-medium.jpg',
        caption: 'Passion4Fusion, Grant £36,700'
    }),
    rathlinIslandDevelopment: createHeroImage({
        small: 'hero/rathlin-island-development-small.jpg',
        medium: 'hero/rathlin-island-development-medium.jpg',
        large: 'hero/rathlin-island-development-large.jpg',
        default: 'hero/rathlin-island-development-medium.jpg',
        caption: 'Rathlin Island Development and Community Association'
    }),
    sortedProject: createHeroImage({
        small: 'hero/sorted-project-small.jpg',
        medium: 'hero/sorted-project-medium.jpg',
        large: 'hero/sorted-project-large.jpg',
        default: 'hero/sorted-project-medium.jpg',
        caption: 'Sorted Project'
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

const defaultHeroImage = heroImages.rathlinIslandDevelopment;

const withFallbackImage = heroImage => heroImage || defaultHeroImage;

module.exports = {
    heroImages,
    defaultHeroImage,
    createHeroImage,
    withFallbackImage
};
