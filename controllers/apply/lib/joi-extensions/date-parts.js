'use strict';
const moment = require('moment');
const fromDateParts = require('../from-date-parts');

module.exports = function dateParts(joi) {
    return {
        name: 'dateParts',
        base: joi.object({
            day: joi.number().integer().required(),
            month: joi.number().integer().required(),
            year: joi.number().integer().required(),
        }),
        language: {
            minDate: 'Date must be on or after {{min}}',
            minDateRef: 'Date must be on or after referenced date',
            maxDate: 'Date must be on or before {{max}}',
            rangeLimit: 'Date must be within range',
        },
        pre(value, state, options) {
            const dt = fromDateParts(value);
            if (dt.isValid()) {
                return value;
            } else {
                return this.createError(
                    'any.invalid',
                    { v: value },
                    state,
                    options
                );
            }
        },
        rules: [
            {
                name: 'minDate',
                params: {
                    min: joi.string().required(),
                },
                validate(params, value, state, options) {
                    const date = fromDateParts(value);

                    if (date.isValid() && date.isSameOrAfter(params.min)) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.minDate',
                            { v: value, min: params.min },
                            state,
                            options
                        );
                    }
                },
            },
            {
                name: 'minDateRef',
                params: {
                    ref: joi.func().ref(),
                },
                validate(params, value, state, options) {
                    const refVal = params.ref(
                        state.reference || state.parent,
                        options
                    );

                    const date = fromDateParts(value);
                    const refDate = refVal ? fromDateParts(refVal) : null;

                    if (
                        refDate &&
                        date.isValid() &&
                        date.isSameOrAfter(refDate)
                    ) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.minDateRef',
                            { v: value },
                            state,
                            options
                        );
                    }
                },
            },
            {
                name: 'maxDate',
                params: {
                    max: joi.string().required(),
                },
                validate(params, value, state, options) {
                    const date = fromDateParts(value);

                    if (date.isValid() && date.isSameOrBefore(params.max)) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.maxDate',
                            { v: value, max: params.max },
                            state,
                            options
                        );
                    }
                },
            },
            {
                name: 'rangeLimit',
                params: {
                    ref: joi.func().ref(),
                    limit: joi.object({
                        amount: joi.number().required(),
                        unit: joi.string().required(),
                    }),
                },
                validate(params, value, state, options) {
                    const refVal = params.ref(
                        state.reference || state.parent,
                        options
                    );

                    const date = fromDateParts(value);
                    const refDate = refVal ? fromDateParts(refVal) : moment();

                    const limitDate = refDate
                        .clone()
                        .add(params.limit.amount, params.limit.unit);

                    if (date.isValid() && date.isSameOrBefore(limitDate)) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.rangeLimit',
                            { v: value },
                            state,
                            options
                        );
                    }
                },
            },
        ],
    };
};
