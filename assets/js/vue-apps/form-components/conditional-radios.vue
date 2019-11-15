<script>
export default {
    props: ['options', 'label', 'fieldName', 'subFieldName', 'initialValue'],
    data() {
        return {
            radioOptions: [],
            currentChoice: null
        };
    },
    mounted() {
        this.currentChoice = this.initialValue;
        if (this.options) {
            try {
                const options = JSON.parse(this.options);
                if (options) {
                    this.radioOptions = options;
                }
            } catch (e) {} // eslint-disable-line no-empty
        }
    },
    methods: {
        optionId(option) {
            return `option-${this.fieldName}-${option.value}`;
        }
    },
    computed: {
        inputName() {
            return `${this.fieldName}[${this.subFieldName}]`;
        }
    },
    watch: {
        currentChoice(value) {
            this.$root.$emit('update:conditionalRadio', value);
        }
    }
};
</script>

<template>
    <div>
        <legend class="ff-label ff-address__legend" v-html="label"></legend>
        <ul class="ff-choice__list">
            <li
                class="ff-choice__option ff-choice__option--radio"
                v-for="option in radioOptions"
                :key="option.value"
            >
                <input
                    type="radio"
                    :id="optionId(option)"
                    :name="inputName"
                    :value="option.value"
                    v-model="currentChoice"
                />
                <label class="ff-choice__label" :for="optionId(option)">
                    {{ option.label }}
                </label>
            </li>
        </ul>
    </div>
</template>
