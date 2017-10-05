/* global $ */
'use strict';

const SELECTORS = {
    parent: '.js-random-hero',
    image: '.js-random-hero__image',
    caption: '.js-random-hero__caption'
};

const rand = xs => xs[Math.floor(Math.random() * xs.length)];

function replaceImage($imageEl, randomImage) {
    $imageEl.html(`
        <picture>
            <source srcset="${randomImage.large}" media="(min-width: 980px)">
            <source srcset="${randomImage.medium}" media="(min-width: 600px)">
            <source srcset="${randomImage.small}">
            <img src="${randomImage.default}" alt="${randomImage.caption || ''}">
        </picture>
    `);
}

function replaceCaption($captionEl, caption) {
    if ($captionEl.length > 0) {
        $captionEl.text(caption || '');
    }
}

function init() {
    $(SELECTORS.parent).each(function() {
        const $heroEl = $(this);
        const imageCandidates = $heroEl.data('imageCandidates');
        const $imageEl = $heroEl.find(SELECTORS.image);
        const $captionEl = $heroEl.find(SELECTORS.caption);

        if (imageCandidates.length > 1 && $imageEl.length > 0) {
            const randomImage = rand(imageCandidates);

            if (randomImage) {
                replaceImage($imageEl, randomImage);
                replaceCaption($captionEl, randomImage.caption);

                $heroEl.addClass('has-image');
            }
        }
    });
}

module.exports = {
    init: init
};
