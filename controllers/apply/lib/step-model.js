'use strict';
const has = require('lodash/has');
const reject = require('lodash/reject');

class Step {
    constructor(props) {
        if (props.title) {
            this.title = props.title;
        } else {
            throw new Error('Must provide title');
        }

        this._fieldsets = reject(
            props.fieldsets || [],
            fieldset => fieldset.fields.length === 0
        );

        /**
         * If there is only one fieldset,
         * set the legend to be the same as the step
         */
        const shouldSetDefaultLegend =
            this._fieldsets.length === 1 &&
            has(this._fieldsets[0], 'legend') === false;

        if (shouldSetDefaultLegend) {
            this.fieldsets[0].legend = this.title;
        }

        /**
         * Flag optional steps if there are no fields
         * i.e. to account for cases where whole step is conditional
         */
        this.isRequired = this.getCurrentFields().length > 0;

        this.noValidate = props.noValidate !== false;
        this.isMultipart = props.isMultipart === true;

        if (props.preFlightCheck) {
            this.preFlightCheck = props.preFlightCheck;
        }

        this._slug = null;
    }

    get fieldsets() {
        return this._fieldsets;
    }

    set fieldsets(fieldsets) {
        this._fieldsets = fieldsets;
        return this;
    }

    get slug() {
        return this._slug;
    }

    set slug(slug) {
        this._slug = slug;
        return this;
    }

    getCurrentFields() {
        return this.fieldsets.flatMap(fieldset => fieldset.fields);
    }

    filterErrors(messages) {
        const fieldNames = this.getCurrentFields().map(field => field.name);
        return messages.filter(item => fieldNames.includes(item.param));
    }
}

class CustomStep extends Step {
    constructor(props) {
        super(props);

        this.type = 'custom';
        this.isRequired = true;

        if (props.render && typeof props.render === 'function') {
            this.render = props.render;
        } else {
            throw new Error('Must provide render function');
        }
    }
}

module.exports = {
    Step,
    CustomStep
};
