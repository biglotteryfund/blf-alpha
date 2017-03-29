/* global L,mapboxgl */
'use strict';

// dev test
const DISABLE_GL = false;
// const DISABLE_GL = true;

// configure grant data for map
const grantData = [
    {
        "name": "South West",
        "cartodb_id": 6,
        "totalAwarded": 36520521.98,
        "numGrants": 1016
    },
    {
        "name": "Scotland",
        "cartodb_id": 13,
        "totalAwarded": 111276238.98,
        "numGrants": 3008
    },
    {
        "name": "East Midlands",
        "cartodb_id": 7,
        "totalAwarded": 71704233.38999999,
        "numGrants": 851
    },
    {
        "name": "West Midlands",
        "cartodb_id": 4,
        "totalAwarded": 47640121.46,
        "numGrants": 1088
    },
    {
        "name": "London",
        "cartodb_id": 3,
        "totalAwarded": 223806798.16999996,
        "numGrants": 1365
    },
    {
        "name": "East of England",
        "cartodb_id": 9,
        "totalAwarded": 58675152.62999999,
        "numGrants": 674
    },
    {
        "name": "North East",
        "cartodb_id": 1,
        "totalAwarded": 34707389.940000005,
        "numGrants": 554
    },
    {
        "name": "Northern Ireland",
        "cartodb_id": 12,
        "totalAwarded": 12851020.13,
        "numGrants": 592
    },
    {
        "name": "South East Coast",
        "cartodb_id": 8,
        "totalAwarded": 17687173.56,
        "numGrants": 527
    },
    {
        "name": "Yorkshire and the Humber",
        "cartodb_id": 5,
        "totalAwarded": 88337519.25999996,
        "numGrants": 981
    },
    {
        "name": "South Central",
        "cartodb_id": 6,
        "totalAwarded": 16297303.830000002,
        "numGrants": 389
    },
    {
        "name": "North West",
        "cartodb_id": 2,
        "totalAwarded": 110342378.00000001,
        "numGrants": 1418
    },
    {
        "name": "Wales",
        "cartodb_id": 11,
        "totalAwarded": 25316250.32,
        "numGrants": 960
    }
];

// look up a grant by region
let getGrantDataById = (id) => grantData.find(g => g.cartodb_id === id);

// turn 32424.23123 => 32,424.23
let formatCurrency = function (n) {
    return n.toFixed(2).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
};

// build html string for map overlay
let makeHTMLPopup = function (data) {
    return `<div class="map-popup-box">
            <h5>${data.name}</h5>
            <ul>
                <li><strong>Grants made</strong>: ${data.numGrants}</li>
                <li><strong>Total awarded</strong>: &pound;${formatCurrency(data.totalAwarded)}</li>
            </ul>
        </div>`;
};

// bind events for mapbox.js
let onEachFeature = function (feature, layer) {
    let data = getGrantDataById(feature.properties.cartodb_id);
    if (data) {
        layer.bindPopup(makeHTMLPopup(data));
    }
};

let MAP;
const GEOJSON_URL = '/javascripts/geojson/regions.json';
const START_ZOOM = 4.5;
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWF0dGFuZHJld3MiLCJhIjoiY2owczczbWQ2MDAycjMycWxlaTBwOTIzYSJ9.kymhXY2DQq4xyb1Cf5qH2g';
const START_POS = {
    lat: 53.789288,
    lng: -2.240503
};

// work out which mapbox to use
if (!mapboxgl.supported() || DISABLE_GL) { // use oldschool mapbox
    L.mapbox.accessToken = MAPBOX_TOKEN;
    MAP = L.mapbox.map('map', 'mapbox.streets').setView([START_POS.lat, START_POS.lng], START_ZOOM);
    fetch(GEOJSON_URL).then(r => r.json()).then(geojson => {
        L.geoJson(geojson, {
                style: function (feature) {
                    return {
                        "color": (typeof feature.properties.stroke !== 'undefined') ? feature.properties.stroke : feature.properties.fill,
                        "fillColor": (typeof feature.properties.fill !== 'undefined') ? feature.properties.fill: '#cccccc',
                        "fillOpacity": 1
                    };
                },
                onEachFeature: onEachFeature
            }
        ).addTo(MAP);

    });

} else { // use modern mapbox

    mapboxgl.accessToken = MAPBOX_TOKEN;
    MAP = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [START_POS.lng, START_POS.lat],
        zoom: START_ZOOM
    });

    MAP.on('load', function () {
        MAP.addLayer({
            id: 'regions',
            type: 'fill',
            source: {
                type: 'geojson',
                data: GEOJSON_URL
            },
            'layout': {},
            'paint': {
                'fill-color': {
                    "property": "fill",
                    "type": "identity"
                },
                // 'fill-outline-color': {
                //     "property": "stroke",
                //     "type": "identity"
                // },
                'fill-opacity': 0.8
            }
        });

        // MAP.addControl(new mapboxgl.NavigationControl(), 'top-left');
         MAP.scrollZoom.disable();
    });

    // bind clicks on layers
    MAP.on('click', function (e) {
        let features = MAP.queryRenderedFeatures(e.point);
        if (!features.length) {
            return;
        }
        let feature = features[0];
        let data = getGrantDataById(feature.properties.cartodb_id);
        if (data) {
            let popup = new mapboxgl.Popup()
                .setLngLat(MAP.unproject(e.point))
                .setHTML(makeHTMLPopup(data))
                .addTo(MAP);
        }
    });
}