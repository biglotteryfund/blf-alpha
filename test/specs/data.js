/* global describe, it, expect */
"use strict";
let regions = require('../../assets/js/data/regions');
require('../../assets/js/utils'); // required because phantom doesn't support Array.find

describe("Grant region data", () => {

    it("has grant data for regions", () => {
        let london = regions.grantData.filter(r => r.name === 'London');
        expect(london.length).to.equal(1);
    });

    it("should allow filtering by ID", () => {
        expect(regions.getGrantDataById('wales').numGrants).to.equal(960);
    });

});