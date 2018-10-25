<script>
import isPlainObject from 'lodash/isPlainObject';

export default {
    props: ['value', 'name', 'label', 'labelAny', 'options', 'clearLabel'],
    computed: {
        isOptgroup() {
            return isPlainObject(this.options);
        },
        id() {
            return `field-dynamic-${this.name}`;
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
                @input="$emit('input', $event.target.value)">
                <option value="" v-if="labelAny">{{ labelAny }}</option>
                <template v-if="isOptgroup">
                    <optgroup v-for="(group, groupLabel) in options" :label="groupLabel" :key="groupLabel">
                        <option v-for="(option, index) in group" :value="option.value" :key="index">
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

            <button type="button"
                    class="btn-link filter-clear-btn"
                    @click="$emit('clear-selection')"
                    v-if="value">
                {{ clearLabel }}
            </button>
        </div>
    </div>
</template>
