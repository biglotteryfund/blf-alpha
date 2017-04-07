'use strict';
require('./utils');


// configure grant data for map
const grantData = [
    {
        "name": "South West",
        "id": "south-west",
        "totalAwarded": 36520521.98,
        "numGrants": 1016
    },
    {
        "name": "Scotland",
        "id": "scotland",
        "totalAwarded": 111276238.98,
        "numGrants": 3008
    },
    {
        "name": "East Midlands",
        "id": "east-midlands",
        "totalAwarded": 71704233.38999999,
        "numGrants": 851
    },
    {
        "name": "West Midlands",
        "id": "west-midlands",
        "totalAwarded": 47640121.46,
        "numGrants": 1088
    },
    {
        "name": "London",
        "id": "london",
        "totalAwarded": 223806798.16999996,
        "numGrants": 1365
    },
    {
        "name": "East of England",
        "id": "east-england",
        "totalAwarded": 58675152.62999999,
        "numGrants": 674
    },
    {
        "name": "North East",
        "id": "north-east",
        "totalAwarded": 34707389.940000005,
        "numGrants": 554
    },
    {
        "name": "Northern Ireland",
        "id": "northern-ireland",
        "totalAwarded": 12851020.13,
        "numGrants": 592
    },
    {
        "name": "South East Coast",
        "id": "south-east",
        "totalAwarded": 17687173.56,
        "numGrants": 527
    },
    {
        "name": "Yorkshire and the Humber",
        "id": "yorkshire",
        "totalAwarded": 88337519.25999996,
        "numGrants": 981
    },
    {
        "name": "South Central",
        "id": "south-west",
        "totalAwarded": 16297303.830000002,
        "numGrants": 389
    },
    {
        "name": "North West",
        "id": "north-west",
        "totalAwarded": 110342378.00000001,
        "numGrants": 1418
    },
    {
        "name": "Wales",
        "id": "wales",
        "totalAwarded": 25316250.32,
        "numGrants": 960
    }
];

// look up a grant by region
let getGrantDataById = (id) => grantData.find(g => g.id === id);

// turn 32424.23123 => 32,424.23
let formatCurrency = function (n) {
    return n.toFixed(2).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
};

let $svg = document.getElementById('js-map-svg');
let $mapInfo = document.getElementById('js-map-info');

$svg.addEventListener('click', function (e) {
    let id = e.target.getAttribute('data-id');
    if (id) {
        let data = getGrantDataById(id);
        if (data) {
            $mapInfo.querySelector('#js-region-name').textContent = data.name;
            $mapInfo.querySelector('#js-num-grants').textContent = data.numGrants;
            $mapInfo.querySelector('#js-num-awards').textContent = `£${formatCurrency(data.totalAwarded)}`;
            $mapInfo.classList.remove('hidden');
        }
    }
});

// fake a click on the default region
let defaultRegion = document.getElementById('js-initial-region');
var e = document.createEvent('UIEvents');
e.initUIEvent('click', true, true, window, 1);
defaultRegion.dispatchEvent(e);

console.log('hello, world!');