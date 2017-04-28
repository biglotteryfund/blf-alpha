'use strict';
const carousel = require('./modules/carousel');

// @TODO - read breakpoint value here from config?
carousel.init({
    selector: '.js-carousel',
    perPage: {
        1: 1,
        760: 3
    },
    nextSelector: '.js-carousel-next',
    prevSelector: '.js-carousel-prev',
});


const regions = require('./data/regions');
const utils = require('./utils');

let $svg = document.getElementById('js-map-svg');
let $mapInfo = document.getElementById('js-map-info');

$svg.addEventListener('click', function (e) {
    let id = e.target.getAttribute('data-id');
    if (id) {
        let data = regions.getGrantDataById(id);
        if (data) {
            $mapInfo.querySelector('#js-region-name').textContent = data.name;
            $mapInfo.querySelector('#js-num-grants').textContent = data.numGrants;
            $mapInfo.querySelector('#js-num-awards').textContent = `£${utils.formatCurrency(data.totalAwarded)}`;
            $mapInfo.classList.remove('hidden');
        }
    }
});

// fake a click on the default region
let defaultRegion = document.getElementById('js-initial-region');
let e = document.createEvent('UIEvents');
e.initUIEvent('click', true, true, window, 1);
defaultRegion.dispatchEvent(e);