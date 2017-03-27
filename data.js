'use strict';

const grants = require('./app/grantnav.json');
const _ = require('lodash');

let regions = grants.grants.map(g => g.recipientRegionName).filter(g => g !== undefined);
let counts = _.countBy(regions);
// let list = _.sortBy(counts);
console.log(counts);