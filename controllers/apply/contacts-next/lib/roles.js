'use strict';

const get = require('lodash/fp/get');

const { ORGANISATION_TYPES, STATUTORY_BODY_TYPES } = require('../constants');

module.exports = function rolesFor({
    locale = 'en',
    organisationType,
    organisationSubType
}) {
    const localise = get(locale);
    const ROLES = {
        CHAIR: {
            value: 'chair',
            label: localise({ en: 'Chair', cy: 'Cadeirydd' })
        },
        CHANCELLOR: {
            value: 'chancellor',
            label: localise({ en: 'Chancellor', cy: 'Canghellor' })
        },
        CHIEF_EXECUTIVE: {
            value: 'chief-executive',
            label: localise({ en: 'Chief Executive', cy: 'Prif Weithredwr' })
        },
        CHIEF_EXECUTIVE_OFFICER: {
            value: 'chief-executive-officer',
            label: localise({
                en: 'Chief Executive Officer',
                cy: 'Swyddog Prif Weithredwr'
            })
        },
        COMPANY_DIRECTOR: {
            value: 'company-director',
            label: localise({ en: 'Company Director', cy: 'Cyfarwyddwr Cwmni' })
        },
        COMPANY_SECRETARY: {
            value: 'company-secretary',
            label: localise({
                en: 'Company Secretary',
                cy: 'Ysgrifennydd cwmni'
            })
        },
        DEPUTY_PARISH_CLERK: {
            value: 'deputy-parish-clerk',
            label: localise({
                en: 'Deputy Parish Clerk',
                cy: 'Dirprwy Glerc y Plwyf'
            })
        },
        DIRECTOR: {
            value: 'director',
            label: localise({ en: 'Director', cy: 'Cyfarwyddwr' })
        },
        ELECTED_MEMBER: {
            value: 'elected-member',
            label: localise({ en: 'Elected Member', cy: 'Aelod etholedig' })
        },
        HEAD_TEACHER: {
            value: 'head-teacher',
            label: localise({ en: 'Head Teacher', cy: 'Prifathro' })
        },
        PARISH_CLERK: {
            value: 'parish-clerk',
            label: localise({ en: 'Parish Clerk', cy: 'Clerc Plwyf' })
        },
        RELIGIOUS_LEADER: {
            value: 'religious-leader',
            label: localise({
                en: 'Religious leader (eg. rabbi, imam, vicar)',
                cy: 'Arweinydd crefyddol (e.e. rabi, imam, ficar)'
            })
        },
        SECRETARY: {
            value: 'secretary',
            label: localise({ en: 'Secretary', cy: 'Ysgrifennydd' })
        },
        TREASURER: {
            value: 'treasurer',
            label: localise({ en: 'Treasurer', cy: 'Trysorydd' })
        },
        TRUSTEE: {
            value: 'trustee',
            label: localise({ en: 'Trustee', cy: 'Ymddiriedolwr' })
        },
        VICE_CHAIR: {
            value: 'vice-chair',
            label: localise({ en: 'Vice-chair', cy: 'Is-gadeirydd' })
        },
        VICE_CHANCELLOR: {
            value: 'vice-chancellor',
            label: localise({ en: 'Vice-chancellor', cy: 'Is-ganghellor' })
        }
    };

    let options = [];
    switch (organisationType) {
        case ORGANISATION_TYPES.UNREGISTERED_VCO:
            options = [
                ROLES.CHAIR,
                ROLES.VICE_CHAIR,
                ROLES.SECRETARY,
                ROLES.TREASURER
            ];
            break;
        case ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY:
            options = [ROLES.TRUSTEE];
            break;
        case ORGANISATION_TYPES.CIO:
            options = [ROLES.TRUSTEE, ROLES.CHIEF_EXECUTIVE_OFFICER];
            break;
        case ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY:
            options = [ROLES.COMPANY_DIRECTOR, ROLES.COMPANY_SECRETARY];
            break;
        case ORGANISATION_TYPES.SCHOOL:
            options = [ROLES.HEAD_TEACHER];
            break;
        case ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY:
            options = [ROLES.CHANCELLOR, ROLES.VICE_CHANCELLOR];
            break;
        case ORGANISATION_TYPES.FAITH_GROUP:
            options = [
                ROLES.CHAIR,
                ROLES.VICE_CHAIR,
                ROLES.SECRETARY,
                ROLES.TREASURER,
                ROLES.RELIGIOUS_LEADER
            ];
            break;
        case ORGANISATION_TYPES.CIC:
            options = [ROLES.COMPANY_DIRECTOR, ROLES.COMPANY_SECRETARY];
            break;
        default:
            options = Object.values(ROLES);
            break;
    }

    // Add custom options for statutory bodies
    if (
        organisationType === ORGANISATION_TYPES.STATUTORY_BODY &&
        organisationSubType
    ) {
        switch (organisationSubType) {
            case STATUTORY_BODY_TYPES.PARISH_COUNCIL:
                options = [ROLES.PARISH_CLERK, ROLES.DEPUTY_PARISH_CLERK];
                break;
            case STATUTORY_BODY_TYPES.TOWN_COUNCIL:
                options = [ROLES.ELECTED_MEMBER, ROLES.CHAIR];
                break;
            case STATUTORY_BODY_TYPES.LOCAL_AUTHORITY:
                options = [ROLES.CHAIR, ROLES.CHIEF_EXECUTIVE, ROLES.DIRECTOR];
                break;
            case STATUTORY_BODY_TYPES.NHS_TRUST:
                options = [ROLES.CHIEF_EXECUTIVE, ROLES.DIRECTOR];
                break;
            default:
                options = Object.values(ROLES);
                break;
        }
    }

    return options;
};
