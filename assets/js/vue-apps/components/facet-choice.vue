<script>
import take from 'lodash/take';

export default {
    props: ['value', 'type', 'name', 'label', 'hideLabel', 'options', 'optionLimit'],
    data() {
        return { isOpen: false };
    },
    computed: {
        optionsToDisplay() {
            if (this.shouldTruncate()) {
                return this.isOpen ?  this.options : take(this.options, this.optionLimit);
            } else {
                return this.options;
            }
        }
    },
    methods: {
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
    <fieldset class="ff-choice" v-if="options.length > 0">
        <legend class="ff-label" :class="{ 'u-visually-hidden': hideLabel }">
            {{ label }}
        </legend>
         <ul class="ff-choice__list">
            <li class="ff-choice__option" v-for="(option, index) in optionsToDisplay" v-bind:key="option.value">
                <input
                    :type="type"
                    :id="fieldId(index)"
                    :name="name"
                    :value="option.value"
                    :checked="option.value === value"
                    v-on:input="$emit('input', $event.target.value)"
                />
                <label class="ff-choice__label" :for="fieldId(index)">
                    {{ option.label }}
                </label>
            </li>
        </ul>

        <button type="button"
            class="btn-link"
            v-if="shouldTruncate()"
            @click='isOpen = !isOpen'
        >
            {{ isOpen ? 'See fewer options' : 'See more options' }}
        </button>

        <button type="button"
            class="btn-link"
            v-if="value"
            @click="$emit('clear-selection')"
        >
            Clear selection
        </button>
    </fieldset>
</template>
