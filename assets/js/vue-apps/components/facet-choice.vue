<script>
import take from 'lodash/take';

export default {
    props: ['value', 'type', 'name', 'label', 'hideLabel', 'options', 'optionLimit', 'copy', 'handleActiveFilter'],
    data() {
        return { isOpen: false };
    },
    computed: {
        optionsToDisplay() {
            if (this.shouldTruncate()) {
                return this.isOpen ? this.options : take(this.options, this.optionLimit);
            } else {
                return this.options;
            }
        }
    },
    methods: {
        handleInput($event, option) {
            this.$emit('input', $event.target.value);
            this.handleActiveFilter({
                label: option.label,
                name: this.name
            });
        },
        shouldTruncate() {
            return this.optionLimit && this.options.length >= this.optionLimit + 2;
        },
        fieldId(index) {
            return `field-dynamic-${this.name}-${index}`;
        }
    }
};
</script>

<template>
    <div>
        <fieldset class="ff-choice" v-if="options.length > 0">
            <legend class="ff-label">
                {{ label }}
            </legend>
            <ul class="ff-choice__list">
                <li class="ff-choice__option ff-choice__option--flex"
                    v-for="(option, index) in optionsToDisplay"
                    :key="option.value">
                    <input
                        :type="type"
                        :id="fieldId(index)"
                        :name="name"
                        :value="option.value"
                        :checked="option.value === value"
                        @input="handleInput($event, option)"
                    />
                    <label class="ff-choice__label" :for="fieldId(index)">
                        {{ option.label }}
                    </label>
                    <button type="button"
                            class="btn-link filter-clear-btn"
                            v-if="option.value === value"
                            @click="$emit('clear-selection')"
                    >
                        {{ copy.filters.clearSelection }}
                    </button>
                </li>
            </ul>
        </fieldset>
        <button type="button"
            class="btn-link"
            v-if="shouldTruncate()"
            @click='isOpen = !isOpen'
        >
            {{ isOpen ? copy.filters.options.truncate.seeFewer : copy.filters.options.truncate.seeMore }}
        </button>
    </div>
</template>
