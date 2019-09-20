'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');
const Joi = require('./joi-extensions');

class TextField {
    constructor(props, locale = 'en') {
        this.locale = locale;

        if (props.name) {
            this.name = props.name;
        } else {
            throw new Error('Must provide name');
        }

        if (props.label) {
            this.label = props.label;
        } else {
            throw new Error('Must provide label');
        }

        this.labelDetails = props.labelDetails;
        this.explanation = props.explanation;

        this.type = props.type || 'text';

        this.isRequired = props.isRequired !== false;

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string().required()
                : Joi.string()
                      .allow('')
                      .optional();
        }

        this.messages = props.messages || [];

        this.attributes = props.attributes || {};
        this.settings = props.settings || {};
    }
    localise(msg) {
        return get(this.locale)(msg);
    }
}

class EmailField extends TextField {
    constructor(props, locale) {
        super(props, locale);
        this.type = 'email';

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string()
                      .email()
                      .required()
                : Joi.string()
                      .email()
                      .optional();
        }

        this.messages = [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter an email address',
                    cy: 'Rhowch gyfeiriad e-bost'
                })
            },
            {
                type: 'string.email',
                message: this.localise({
                    en: oneLine`Email address must be in the correct format,
                        like name@example.com`,
                    cy: oneLine`Rhaid i’r cyfeiriad e-bost for yn y ffurf cywir,
                        e.e enw@example.com`
                })
            }
        ];
    }
}

class PhoneField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'tel';

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string().phoneNumber()
                : Joi.string()
                      .phoneNumber()
                      .allow('')
                      .optional();
        }

        this.messages = [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig'
                })
            },
            {
                type: 'string.phonenumber',
                message: this.localise({
                    en: 'Enter a real UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig go iawn'
                })
            }
        ];
    }
}

class CurrencyField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'currency';

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.friendlyNumber()
                      .integer()
                      .required()
                : Joi.friendlyNumber()
                      .integer()
                      .optional();
        }
    }
}

class TextareaField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'textarea';

        if (!props.minWords || !props.maxWords) {
            throw new Error('Must provide min and max words');
        }

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string()
                      .minWords(props.minWords)
                      .maxWords(props.maxWords)
                      .required()
                : Joi.string()
                      .minWords(props.minWords)
                      .maxWords(props.maxWords)
                      .allow('')
                      .optional();
        }

        this.messages = this.messages.concat([
            {
                type: 'string.minWords',
                message: this.localise({
                    en: `Answer must be at least ${props.minWords} words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf ${props.minWords} gair`
                })
            },
            {
                type: 'string.maxWords',
                message: this.localise({
                    en: `Answer must be no more than ${props.maxWords} words`,
                    cy: `Rhaid i’r ateb fod yn llai na ${props.maxWords} gair`
                })
            }
        ]);
    }
}

class RadioField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'radio';

        const options = props.options || [];
        if (options.length === 0) {
            throw Error('Must provide options');
        }

        this.options = options;

        const baseSchema = Joi.string()
            .valid(options.map(option => option.value))
            .required();

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? baseSchema.required()
                : baseSchema.optional();
        }
    }
}

class CheckboxField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'checkbox';

        const options = props.options || [];
        if (options.length === 0) {
            throw Error('Must provide options');
        }

        this.options = options;

        const baseSchema = Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? baseSchema.required()
                : baseSchema.optional();
        }
    }
}

module.exports = {
    TextField,
    EmailField,
    CurrencyField,
    PhoneField,
    TextareaField,
    RadioField,
    CheckboxField
};
