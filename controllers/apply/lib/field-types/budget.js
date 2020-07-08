'use strict';
const isArray = require('lodash/isArray');
const sumBy = require('lodash/sumBy');
const { oneLine } = require('common-tags');

const Joi = require('../joi-extensions');

const Field = require('./field');

class BudgetField extends Field {
    constructor(props) {
        super(props);
        this.type = 'budget';
        this.rowLimit = props.rowLimit;
        this.min = props.min;
        this.max = props.max;
        this.maxItemNameLength = props.maxItemNameLength;
        this.schema = this.withCustomSchema(props.schema);
    }

    defaultSchema() {
        const rowLimit = this.rowLimit || 10;
        const minBudget = this.min || 1;
        const maxBudget = this.max || 1000000;
        return Joi.budgetItems()
            .max(rowLimit)
            .validBudgetRange(minBudget, maxBudget)
            .required();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a project budget',
                    cy: 'Rhowch gyllideb prosiect',
                }),
            },
            {
                type: 'any.invalid',
                message: this.localise({
                    en: 'Enter a real day and month',
                    cy: 'Rhowch ddiwrnod a mis go iawn',
                }),
            },
            {
                type: 'any.empty',
                key: 'item',
                message: this.localise({
                    en: 'Enter an item or activity',
                    cy: 'Rhowch eitem neu weithgaredd',
                }),
            },
            {
                type: 'string.max',
                key: 'item',
                get message() {
                    return this.localise({
                        en: `Item or activity must be ${this.maxItemNameLength} characters or less`,
                        cy: `Rhaid i’r eitem neu weithgaredd fod yn llai na ${this.maxItemNameLength} nod`,
                    });
                },
            },
            {
                type: 'number.base',
                key: 'cost',
                message: this.localise({
                    en: 'Enter an amount',
                    cy: 'Rhowch nifer',
                }),
            },
            {
                type: 'number.integer',
                key: 'cost',
                message: this.localise({
                    en: 'Use whole numbers only, eg. 360',
                    cy: 'Defnyddiwch rifau cyflawn yn unig, e.e. 360',
                }),
            },
            {
                type: 'number.min',
                message: this.localise({
                    en: 'Amount must be £1 or more',
                    cy: `Rhaid i'r eitemau gostio £1 neu fwy`,
                }),
            },
            {
                type: 'array.min',
                message: this.localise({
                    en: 'Enter at least one item',
                    cy: 'Rhowch o leiaf un eitem',
                }),
            },
            {
                type: 'array.max',
                get message() {
                    return this.localise({
                        en: `Enter no more than ${this.rowLimit} items`,
                        cy: `Rhowch dim mwy na ${this.rowLimit} eitem`,
                    });
                },
            },
            {
                type: 'budgetItems.overBudget',
                get message() {
                    return this.localise({
                        en: oneLine`Costs you would like us to fund must be
                                less than £${this.max.toLocaleString()}`,
                        cy: oneLine`Rhaid i’r costau hoffech i ni eu hariannu
                                fod yn llai na £${this.max.toLocaleString()}`,
                    });
                },
            },
            {
                type: 'budgetItems.underBudget',
                get message() {
                    return this.localise({
                        en: oneLine`Costs you would like us to fund must be
                                greater than £${this.min.toLocaleString()}`,
                        cy: oneLine`Rhaid i’r costau hoffech i ni eu hariannu
                                fod yn fwy na £${this.min.toLocaleString()}`,
                    });
                },
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            if (!isArray(this.value)) {
                return this.value;
            } else {
                const total = sumBy(
                    this.value,
                    (item) => parseInt(item.cost, 10) || 0
                );
                return [
                    this.value
                        .filter((line) => line.item && line.cost)
                        .map(
                            (line) =>
                                `${line.item} – £${line.cost.toLocaleString()}`
                        )
                        .join('\n'),
                    this.localise({
                        en: `Total: £${total.toLocaleString()}`,
                        cy: `Cyfanswm: £${total.toLocaleString()}`,
                    }),
                ].join('\n');
            }
        } else {
            return '';
        }
    }
}

module.exports = BudgetField;
