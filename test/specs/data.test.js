/* global describe, it, expect */
"use strict";
let regions = require('../../config/content/regions.json');
require('../../assets/js/utils'); // required because phantom doesn't support Array.find

describe("Grant region data", () => {

    it("has grant data for regions", () => {
        let london = regions.filter(r => r.id === 'london');
        expect(london.length).to.equal(1);
    });

    it("should allow filtering by ID", () => {
        expect(regions.find(g => g.id === 'wales').beneficiaries).to.equal(706774);
    });

});