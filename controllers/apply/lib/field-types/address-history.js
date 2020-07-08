'use strict';
const get = require('lodash/fp/get');
const compact = require('lodash/compact');

const Joi = require('../joi-extensions');

const Field = require('./field');

function formatAddress(value) {
    return compact([
        value.line1,
        value.line2,
        value.townCity,
        value.county,
        value.postcode,
    ]).join(',\n');
}

class AddressHistoryField extends Field {
    constructor(props) {
        super(props);
        this.orgTypesToExcludeContactDetails =
            props.orgTypesToExcludeContactDetails;
        this.schema = this.withCustomSchema(props.schema);
    }

    getType() {
        return 'address-history';
    }

    defaultSchema() {
        const orgTypesToExcludeContactDetails =
            this.orgTypesToExcludeContactDetails || [];

        // @TODO this should be implemented on the individual field level
        function stripIfExcludedOrgType(schema) {
            return Joi.when(Joi.ref('organisationType'), {
                is: Joi.exist().valid(orgTypesToExcludeContactDetails),
                then: Joi.any().strip(),
                otherwise: schema,
            });
        }

        return stripIfExcludedOrgType(
            Joi.object({
                currentAddressMeetsMinimum: Joi.string()
                    .valid(['yes', 'no'])
                    .required(),
                previousAddress: Joi.when(
                    Joi.ref('currentAddressMeetsMinimum'),
                    {
                        is: 'no',
                        then: Joi.ukAddress().required(),
                        otherwise: Joi.any().strip(),
                    }
                ),
            }).required()
        );
    }

    // @TODO the length constraints here don't seem to fire as they're hardcoded in ukAddress
    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a full UK address',
                    cy: 'Rhowch gyfeiriad Prydeining llawn',
                }),
            },
            {
                type: 'any.required',
                key: 'currentAddressMeetsMinimum',
                message: this.localise({
                    en: 'Choose from one of the options provided',
                    cy: 'Dewiswch o un o’r opsiynau a ddarperir',
                }),
            },
            {
                type: 'any.empty',
                key: 'line1',
                message: this.localise({
                    en: 'Enter a building and street',
                    cy: 'Rhowch adeilad a stryd',
                }),
            },
            {
                type: 'string.max',
                key: 'line1',
                get message() {
                    return this.localise({
                        en: `Building and street must be ${this.textMaxLengths.large} characters or less`,
                        cy: `Rhaid i’r adeilad a’r stryd fod yn llai na ${this.textMaxLengths.large} nod`,
                    });
                },
            },
            {
                type: 'string.max',
                key: 'line2',
                get message() {
                    return this.localise({
                        en: `Address line must be ${this.textMaxLengths.large} characters or less`,
                        cy: `Rhaid i’r llinell cyfeiriad fod yn llai na ${this.textMaxLengths.large} nod`,
                    });
                },
            },
            {
                type: 'any.empty',
                key: 'townCity',
                message: this.localise({
                    en: 'Enter a town or city',
                    cy: 'Rhowch dref neu ddinas',
                }),
            },
            {
                type: 'any.empty',
                key: 'county',
                message: this.localise({
                    en: 'Enter a county',
                    cy: 'Rhowch sir',
                }),
            },
            {
                type: 'string.max',
                key: 'townCity',
                get message() {
                    return this.localise({
                        en: `Town or city must be ${this.textMaxLengths.small} characters or less`,
                        cy: `Rhaid i’r dref neu ddinas fod yn llai na ${this.textMaxLengths.small} nod`,
                    });
                },
            },
            {
                type: 'string.max',
                key: 'county',
                get message() {
                    return this.localise({
                        en: `County must be ${this.textMaxLengths.medium} characters or less`,
                        cy: `Rhaid i’r sir fod yn llai na ${this.textMaxLengths.medium} nod`,
                    });
                },
            },
            {
                type: 'any.empty',
                key: 'postcode',
                message: this.localise({
                    en: 'Enter a postcode',
                    cy: 'Rhowch gôd post',
                }),
            },
            {
                type: 'string.postcode',
                key: 'postcode',
                message: this.localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn',
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            const meetsMinimum = get('currentAddressMeetsMinimum')(this.value);
            const previousAddress = get('previousAddress')(this.value);

            if (previousAddress && meetsMinimum === 'no') {
                return formatAddress(previousAddress);
            } else {
                return this.localise({ en: 'Yes', cy: 'Do' });
            }
        } else {
            return '';
        }
    }
}

module.exports = AddressHistoryField;
