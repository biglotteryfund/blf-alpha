'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');
const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
const phoneUtil = PhoneNumberUtil.getInstance();

class PhoneField extends Field {
    getType() {
        return 'tel';
    }

    defaultAttributes() {
        return { size: 40, autocomplete: 'tel' };
    }

    defaultLabel() {
        return this.localise({
            en: `Telephone number`,
            cy: `Rhif ffôn`,
        });
    }

    defaultSchema() {
        const baseSchema = Joi.string().phoneNumber();
        return this.isRequired
            ? baseSchema.required()
            : baseSchema.allow('').optional();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig',
                }),
            },
            {
                type: 'string.phonenumber',
                message: this.localise({
                    en: 'Enter a real UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig go iawn',
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            const parsedValue = phoneUtil.parse(this.value, 'GB');
            if (phoneUtil.isValidNumber(parsedValue)) {
                return phoneUtil.format(
                    parsedValue,
                    PhoneNumberFormat.NATIONAL
                );
            } else {
                return this.value;
            }
        } else {
            return '';
        }
    }
}

module.exports = PhoneField;
