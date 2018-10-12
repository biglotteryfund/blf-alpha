<script>
import take from 'lodash/take';

export default {
    props: ['value', 'type', 'name', 'label', 'labelAny', 'options'],
    data() {
        return { isToggled: false, optionLimit: 3 }
    },
    computed: {
        shouldTruncate() {
            return this.options.length >= (this.optionLimit + 2);
        },
        optionsToDisplay() {
            console.log(this.shouldTruncate);
            if (this.shouldTruncate) {
                return this.isToggled ? this.options : take(this.options, this.optionLimit);
                } else {
                return this.options;
            }
        }
    },
    methods: {
        fieldId(index) {
            return `field-dynamic-${this.name}-${index}`;
        }
    }
};
</script>

<template>
    <fieldset class="ff-choice">
        <legend class="ff-label">
            {{ label }}
        </legend>
         <ul class="ff-choice__list">
             <li class="ff-choice__option">
                <input
                    :type="type"
                    :id="fieldId('any')"
                    :name="name"
                    value=""
                    :checked="value === ''"
                    v-on:input="$emit('input', $event.target.value)"
                />
                <label class="ff-choice__label" :for="fieldId('any')">
                    {{ labelAny }}
                </label>
            </li>
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

        <button type="button" class="btn-link"
            v-on:click='isToggled = !isToggled'
            v-if="shouldTruncate">
            {{ isToggled ? 'See fewer options' : 'See more options' }}
        </button>

        <button class="btn-link" v-if="value"
            @click="$emit('clear-choice')">
            Clear {{ label.toLowerCase() }}
        </button>
    </fieldset>
</template>
