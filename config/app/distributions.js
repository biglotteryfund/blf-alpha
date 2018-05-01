'use strict';
module.exports = {
    test: {
        distributionId: 'E3D5QJTWAG3GDP',
        origins: {
            legacy: 'LEGACY',
            newSite: 'ELB-TEST'
        }
    },
    live: {
        distributionId: 'E2WYWBLMWIN5U1',
        origins: {
            legacy: 'LEGACY',
            newSite: 'ELB_LIVE'
        }
    }
};
