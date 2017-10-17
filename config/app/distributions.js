module.exports = {
    test: {
        distributionId: 'E3D5QJTWAG3GDP',
        origins: {
            newSite: 'ELB-TEST'
        }
    },
    live: {
        distributionId: 'E2WYWBLMWIN5U1',
        origins: {
            legacy: 'Custom-www.biglotteryfund.org.uk',
            newSite: 'ELB_LIVE'
        }
    }
};
