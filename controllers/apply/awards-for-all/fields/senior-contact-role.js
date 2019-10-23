'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const { ORGANISATION_TYPES, STATUTORY_BODY_TYPES } = require('../constants');
const rolesFor = require('../lib/roles');

module.exports = function(locale, data) {
    const localise = get(locale);

    const projectCountry = get('projectCountry')(data);
    const currentOrganisationType = get('organisationType')(data);
    const currentOrganisationSubType = get('organisationSubType')(data);

    const isCompany = [
        ORGANISATION_TYPES.CIO,
        ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
    ].includes(currentOrganisationType);

    const isRegisteredCharity = [
        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY
    ].includes(currentOrganisationType);

    /**
     * Statutory bodies require a sub-type,
     * some of which allow free text input for roles.
     */
    const isFreeText =
        currentOrganisationType === ORGANISATION_TYPES.STATUTORY_BODY &&
        [
            STATUTORY_BODY_TYPES.PRISON_SERVICE,
            STATUTORY_BODY_TYPES.FIRE_SERVICE,
            STATUTORY_BODY_TYPES.POLICE_AUTHORITY
        ].includes(currentOrganisationSubType);

    function warnings() {
        let result = [];

        if (isCompany) {
            result.push(
                localise({
                    en: oneLine`As you're a company, your senior contact needs
                        to be listed as one of your board members on Companies House.`,
                    cy: `` // @TODO: i18n
                })
            );
        }

        /**
         * Scotland doesn't include trustees in their charity commission
         * data, so don't show this message in Scotland.
         */
        if (isRegisteredCharity && projectCountry !== 'scotland') {
            result.push(
                localise({
                    en: oneLine`As you're a registered charity (that's not also a company),
                        your senior contact needs to be listed as one of your trustees
                        with your charity regulator.`,
                    cy: `` // @TODO: i18n
                })
            );
        }

        if (currentOrganisationType === ORGANISATION_TYPES.CIO) {
            result.push(
                localise({
                    en: oneLine`As a charity, your senior contact can be one of
                        your organisation's trustees. This can include trustees
                        taking on the role of Chair, Vice Chair or Treasurer.`,

                    cy: oneLine`Fel elusen, gall eich uwch gyswllt fod yn un o
                        ymddiriedolwyr eich sefydliad. Gall hyn gynnwys
                        ymddiriedolwyr yn cymryd rôl fel Cadeirydd,
                        Is-gadeirydd neu Drysorydd.  `
                })
            );
        }

        if (isRegisteredCharity) {
            result.push(
                localise({
                    en: oneLine`As a registered charity, your senior contact
                        must be one of your organisation's trustees. This can
                        include trustees taking on the role of Chair,
                        Vice Chair or Treasurer.`,

                    cy: oneLine`Fel elusen gofrestredig, rhaid i’ch uwch gyswllt fod
                        yn un o ymddiriedolwyr eich sefydliad. Gall hyn gynnwys
                        ymddiriedolwyr yn cymryd rôl fel Cadeirydd,
                        Is-gadeirydd neu Drysorydd. `
                })
            );
        }

        if (currentOrganisationType === ORGANISATION_TYPES.SCHOOL) {
            result.push(
                localise({
                    en: `As a school, your senior contact must be the headteacher`,
                    cy: `Fel ysgol, rhaid i’ch uwch gyswllt fod y prifathro`
                })
            );
        }

        return result;
    }

    return {
        name: 'seniorContactRole',
        label: localise({ en: 'Role', cy: 'Rôl' }),
        explanation: localise({
            en: `<p>
                You told us what sort of organisation you are earlier.
                ${
                    isFreeText
                        ? oneLine`So the senior contact role should be someone
                          in a position of authority in your organisation.`
                        : oneLine`So the senior contact role options we're
                          giving you now are based on your organisation type.
                          The options given to you for selection are based on this.`
                }
            </p>`,
            cy: `<p>
                Fe ddywedoch wrthym ba fath o sefydliad ydych yn gynharach.
                ${
                    isFreeText
                        ? oneLine`Felly dylai rôl yr uwch gyswllt fod yn rhywun
                          mewn safle o awdurdod yn eich sefydliad`
                        : oneLine`Felly mae’r opsiynau rôl uwch gyswllt rydym
                          yn ei roi ichi wedi’i seilio ar fath eich sefydliad.
                          Mae’r opsiynau sydd wedi ei ddarparu i chi ddewis
                          ohonynt wedi’i seilio ar hyn`
                }
            </p>`
        }),
        warnings: warnings(),
        type: isFreeText ? 'text' : 'radio',
        options: rolesFor({
            locale: locale,
            organisationType: currentOrganisationType,
            organisationSubType: currentOrganisationSubType
        }),
        isRequired: true,
        get schema() {
            if (isFreeText) {
                return Joi.string().required();
            } else {
                return Joi.string()
                    .valid(this.options.map(option => option.value))
                    .required();
            }
        },
        messages: [
            {
                type: 'base',
                message: isFreeText
                    ? localise({ en: 'Enter a role', cy: 'Rhowch rôl ' })
                    : localise({ en: 'Choose a role', cy: 'Dewiswch rôl ' })
            },
            {
                type: 'any.allowOnly',
                message: localise({
                    en: 'Senior contact role is not valid',
                    cy: 'Nid yw’r rôl uwch gyswllt yn ddilys'
                })
            }
        ]
    };
};
