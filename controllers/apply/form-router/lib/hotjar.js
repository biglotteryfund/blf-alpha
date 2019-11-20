'use strict';

function getShortId(formId) {
    let hotjarAlias;
    switch (formId) {
        case 'awards-for-all':
            hotjarAlias = 'AFA';
            break;
        case 'standard-enquiry':
            hotjarAlias = 'YFP';
            break;
        default:
            hotjarAlias = 'FORM';
            break;
    }
    return hotjarAlias;
}

module.exports = {
    getShortId
};
