'use strict';
const castArray = require('lodash/castArray');
const defaults = require('lodash/defaults');
const filter = require('lodash/filter');
const find = require('lodash/fp/find');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const includes = require('lodash/includes');

const { oneLine } = require('common-tags');

const countWords = require('./count-words');
const Joi = require('./joi-extensions');

class TextField {
    constructor(props, locale = 'en') {
        this.locale = locale;

        // @TODO: Used to switch on non-class type fields
        this._isClass = true;

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

        this.attributes = defaults({ size: 30 }, props.attributes);
        this.settings = props.settings || {};

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

        this.value = undefined;
        this.errors = [];
        this.featuredErrors = [];
    }

    localise(msg) {
        return get(this.locale)(msg);
    }

    get displayValue() {
        if (this.value) {
            return this.value.toString();
        } else {
            return '';
        }
    }

    withValue(value) {
        this.value = value;
        return this;
    }

    withErrors(errors) {
        this.errors = errors;
        return this;
    }

    withFeaturedErrors(featuredErrors) {
        this.featuredErrors = featuredErrors;
        return this;
    }

    validate() {
        return this.schema.validate(this.value);
    }
}

class EmailField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'email';

        this.attributes = defaults(
            { size: 30, autocomplete: 'email' },
            props.attributes
        );

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

        this.attributes = defaults(
            { size: 30, autocomplete: 'tel' },
            props.attributes
        );

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

    get displayValue() {
        if (this.value) {
            return `£${this.value.toLocaleString()}`;
        } else {
            return '';
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

        this.attributes = defaults({ rows: 15 }, props.attributes);

        this.settings = defaults(
            {
                stackedSummary: true,
                showWordCount: true,
                minWords: props.minWords,
                maxWords: props.maxWords
            },
            props.settings
        );

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

    get displayValue() {
        if (this.value) {
            const str = this.value.toString();
            const wordCount = countWords(str);
            return (
                str +
                `\n\n(${wordCount} ${this.localise({
                    en: 'words',
                    cy: 'gair'
                })})`
            );
        } else {
            return '';
        }
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

        const baseSchema = Joi.string().valid(
            options.map(option => option.value)
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? baseSchema.required()
                : baseSchema.optional();
        }
    }

    get displayValue() {
        const match = find(option => option.value === this.value)(this.options);
        return match ? match.label : '';
    }
}

class CheckboxField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'checkbox';

        const options = props.options || [];
        if (options.length === 0) {
            throw new Error('Must provide options');
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

    get displayValue() {
        if (this.value) {
            const choices = castArray(this.value);

            const matches = filter(this.options, option =>
                includes(choices, option.value)
            );

            return matches.length > 0
                ? matches.map(match => match.label).join(',\n')
                : choices.join(',\n');
        } else {
            return '';
        }
    }
}

class SelectField extends TextField {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'select';

        this.optgroups = props.optgroups || [];
        this.options = props.options || [];

        if (this.optgroups.length > 0) {
            if (props.defaultOption) {
                this.defaultOption = props.defaultOption;
            } else {
                throw new Error(
                    'Must provide default option when using optgroups'
                );
            }
        }

        const baseSchema = Joi.string().valid(
            this._normalisedOptions().map(option => option.value)
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? baseSchema.required()
                : baseSchema.optional();
        }
    }

    _normalisedOptions() {
        if (this.optgroups.length > 0) {
            return flatMap(this.optgroups, group => group.options);
        } else {
            return this.options;
        }
    }

    get displayValue() {
        if (this.value) {
            const match = find(option => option.value === this.value)(
                this._normalisedOptions()
            );
            return match ? match.label : '';
        } else {
            return '';
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
    CheckboxField,
    SelectField
};
