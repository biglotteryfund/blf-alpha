'use strict';

const MIN_AGE_MAIN_CONTACT = 16;
const MIN_AGE_SENIOR_CONTACT = 18;
const MAX_BUDGET_TOTAL_GBP = 10000;
const MIN_BUDGET_TOTAL_GBP = 300;

const FREE_TEXT_MAXLENGTH = {
    small: 40,
    medium: 80,
    large: 255,
};

const ORG_MIN_AGE = {
    amount: 15,
    unit: 'months',
    label: { en: '15 months', cy: '15 mis' },
};

const ORGANISATION_TYPES = {
    UNREGISTERED_VCO: 'unregistered-vco',
    UNINCORPORATED_REGISTERED_CHARITY: 'unincorporated-registered-charity',
    CIO: 'charitable-incorporated-organisation',
    NOT_FOR_PROFIT_COMPANY: 'not-for-profit-company',
    CIC: 'community-interest-company',
    SCHOOL: 'school',
    COLLEGE_OR_UNIVERSITY: 'college-or-university',
    STATUTORY_BODY: 'statutory-body',
    FAITH_GROUP: 'faith-group',
};

/**
 * Define which organisation types should
 * exclude contact details.
 */
const CONTACT_EXCLUDED_TYPES = [
    ORGANISATION_TYPES.SCHOOL,
    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
    ORGANISATION_TYPES.STATUTORY_BODY,
];

const STATUTORY_BODY_TYPES = {
    PARISH_COUNCIL: 'parish-council', // ⛪️
    TOWN_COUNCIL: 'town-council', // 🏙
    LOCAL_AUTHORITY: 'local-authority', // 🏛
    NHS_TRUST: 'nhs-trust-health-authority', // 🏥
    PRISON_SERVICE: 'prison-service', // 🔐
    FIRE_SERVICE: 'fire-service', // 🚒
    POLICE_AUTHORITY: 'police-authority', // 🚓
};

const BENEFICIARY_GROUPS = {
    ETHNIC_BACKGROUND: 'ethnic-background',
    GENDER: 'gender',
    AGE: 'age',
    OLDER_PEOPLE: 'older-people',
    DISABLED_PEOPLE: 'disabled-people',
    RELIGION: 'religion',
    LGBT: 'lgbt',
    CARING: 'caring-responsibilities',
    MIGRANT: 'migrant',
    SOCIOECONOMIC: 'socioeconomic',
    OTHER: 'other',
};

const OTHER_GROUPS = {
    OTHER_BLACK: 'other-black',
    OTHER_MIXED: 'other-mixed',
    OTHER_ASIAN: 'other-asian',
    OTHER_ETHNICITY: 'other-ethnicity',
    OTHER_LGBT: 'other-lgbt',
    OTHER_MIGRANT: 'other-migrant',
    OTHER_FAITH: 'other-faith',
    OTHER_DISABILITY: 'other-disability',
};

const COMPANY_NUMBER_TYPES = [
    ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
    ORGANISATION_TYPES.CIC,
];

const EDUCATION_NUMBER_TYPES = [
    ORGANISATION_TYPES.SCHOOL,
    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
];

const CHARITY_NUMBER_TYPES = {
    required: [
        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
        ORGANISATION_TYPES.CIO,
    ],
    optional: [
        ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
        ORGANISATION_TYPES.FAITH_GROUP,
    ],
};

const EXPIRY_EMAIL_REMINDERS = [
    {
        emailType: 'UNDER10K_ONE_MONTH',
        sendBeforeExpiry: {
            amount: 30,
            unit: 'days',
        },
    },
    {
        emailType: 'UNDER10K_ONE_WEEK',
        sendBeforeExpiry: {
            amount: 7,
            unit: 'days',
        },
    },
    {
        emailType: 'UNDER10K_ONE_DAY',
        sendBeforeExpiry: {
            amount: 1,
            unit: 'days',
        },
    },
];

module.exports = {
    BENEFICIARY_GROUPS,
    OTHER_GROUPS,
    COMPANY_NUMBER_TYPES,
    CONTACT_EXCLUDED_TYPES,
    MAX_BUDGET_TOTAL_GBP,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    MIN_BUDGET_TOTAL_GBP,
    ORG_MIN_AGE,
    ORGANISATION_TYPES,
    STATUTORY_BODY_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES,
    FREE_TEXT_MAXLENGTH,
    EXPIRY_EMAIL_REMINDERS,
};
