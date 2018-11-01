<script>
import isPlainObject from 'lodash/isPlainObject';
import IconClose from './icon-close.vue';

export default {
    components: { IconClose },
    props: ['value', 'name', 'label', 'labelAny', 'options', 'clearLabel', 'handleActiveFilter'],
    computed: {
        isOptgroup() {
            return isPlainObject(this.options);
        },
        id() {
            return `field-dynamic-${this.name}`;
        }
    },
    methods: {
        handleInput($event) {
            const target = $event.target;
            const selectedOption = target.options[target.selectedIndex];
            this.$emit('input', $event.target.value);
            this.handleActiveFilter({
                label: selectedOption.text,
                name: this.name
            });
        }
    }
};
</script>

<template>
    <div>
        <label class="ff-label" :for="id">
            {{ label }}
        </label>
        <div class="ff-choice__option ff-choice__option--flex">
            <select
                class="ff-select"
                :id="id"
                :name="name"
                :value="value"
                @input="handleInput">
                <option value="" v-if="labelAny">{{ labelAny }}</option>
                <template v-if="isOptgroup">
                    <optgroup v-for="(group, groupLabel) in options" :label="groupLabel" :key="groupLabel">
                        <option v-for="(option, index) in group"
                                :value="option.value"
                                :selected="option.value === value"
                                :key="index">
                            {{ option.label }}
                        </option>
                    </optgroup>
                </template>
                <template v-else>
                    <option v-for="option in options" :value="option.value" :key="option.label">
                        {{ option.label }}
                    </option>
                </template>
            </select>

            <ul class="filter-list"
                v-if="value"
                @click="$emit('clear-selection')">
                <li class="filter-list__item filter-list__item--btn">
                    <IconClose :id="'clear-' + id" :description="clearLabel" />
                </li>
            </ul>

        </div>
    </div>
</template>
