'use strict';
const grants = require('./grantnav.json');
const _ = require('lodash');

let regionsByName = grants.grants.map(g => g.recipientRegionName).filter(g => g !== undefined);
let regionsCounts = _.countBy(regionsByName);
let districtsByName = grants.grants.map(g => g.recipientDistrictName).filter(g => g !== undefined)
let districtCounts = _.countBy(districtsByName);

let grantsWithDistricts = grants.grants.filter(g => typeof g !== 'undefined');
let numGrants = _.countBy(grantsWithDistricts.map(g => g.recipientRegionName));
let grantsByRegion = _.groupBy(grantsWithDistricts, 'recipientRegionName');
let results = {};

for (let region in grantsByRegion) {
    let total = _.sumBy(grantsByRegion[region], 'amountAwarded');
    results[region] = {
        totalAwarded: total,
        numGrants: numGrants[region]
    };
}

console.log(results);

// let postcode = 'DA7 6NJ';
// rp('http://api.postcodes.io/postcodes/' + encodeURIComponent(postcode)).then(data => {
//     let json = JSON.parse(data);
//     let yourDistrict = json.result.admin_district;
//     console.log('your district is ' + yourDistrict);
//     let match = grants.grants.filter(d => {
//         if (typeof d.recipientDistrictName !== 'undefined') {
//             return d.recipientDistrictName.indexOf(yourDistrict) !== -1;
//         } else {
//             return false;
//         }
//     });
//     console.log(match);
// });

// console.log(regions);
// console.log(districts);