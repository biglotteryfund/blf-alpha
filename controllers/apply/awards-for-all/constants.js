'use strict';

const MIN_AGE_MAIN_CONTACT = 16;
const MIN_AGE_SENIOR_CONTACT = 18;
const MAX_BUDGET_TOTAL_GBP = 10000;
const MIN_BUDGET_TOTAL_GBP = 300;

const ORG_MIN_AGE = {
    amount: 15,
    unit: 'months',
    label: {
        en: '15 months',
        cy: ''
    }
};

const MIN_START_DATE = {
    amount: 18,
    unit: 'weeks',
    label: {
        en: '18 weeks',
        cy: ''
    }
};

const MAX_PROJECT_DURATION = {
    amount: 15,
    unit: 'months',
    label: {
        en: '15 months',
        cy: ''
    }
};

const ORGANISATION_TYPES = {
    UNREGISTERED_VCO: 'unregistered-vco',
    UNINCORPORATED_REGISTERED_CHARITY: 'unincorporated-registered-charity',
    CIO: 'charitable-incorporated-organisation',
    NOT_FOR_PROFIT_COMPANY: 'not-for-profit-company',
    SCHOOL: 'school',
    COLLEGE_OR_UNIVERSITY: 'college-or-university',
    STATUTORY_BODY: 'statutory-body',
    FAITH_GROUP: 'faith-group'
};

const STATUTORY_BODY_TYPES = {
    PARISH_COUNCIL: 'parish-council', // ⛪️
    TOWN_COUNCIL: 'town-council', // 🏙
    LOCAL_AUTHORITY: 'local-authority', // 🏛
    NHS_TRUST: 'nhs-trust-health-authority', // 🏥
    PRISON_SERVICE: 'prison-service', // 🔐
    FIRE_SERVICE: 'fire-service', // 🚒
    POLICE_AUTHORITY: 'police-authority' // 🚓
};

const BENEFICIARY_GROUPS = {
    ETHNIC_BACKGROUND: 'ethnic-background',
    GENDER: 'gender',
    AGE: 'age',
    DISABLED_PEOPLE: 'disabled-people',
    RELIGION: 'religion',
    LGBT: 'lgbt',
    CARING: 'caring-responsibilities'
};

const FILE_LIMITS = {
    SIZE: {
        label: '12MB',
        value: 12 * 1048576 // eg. 12mb in bytes
    },
    TYPES: [
        { mime: 'image/png', label: 'PNG' },
        { mime: 'image/jpeg', label: 'JPEG' },
        { mime: 'application/pdf', label: 'PDF' }
    ]
};

module.exports = {
    BENEFICIARY_GROUPS,
    FILE_LIMITS,
    MIN_BUDGET_TOTAL_GBP,
    MAX_BUDGET_TOTAL_GBP,
    MAX_PROJECT_DURATION,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    MIN_START_DATE,
    ORGANISATION_TYPES,
    STATUTORY_BODY_TYPES,
    ORG_MIN_AGE
};
