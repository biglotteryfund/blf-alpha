/* global describe, it, expect */

let utils = require('../../assets/js/utils');

describe("DOM Tests", function () {

    it("does trivial stuff", function () {
        expect(utils.foo).to.equal('bar');
    });
});