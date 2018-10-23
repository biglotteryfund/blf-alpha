<script>
import isPlainObject from 'lodash/isPlainObject';

export default {
    props: ['value', 'name', 'label', 'labelAny', 'options', 'copy'],
    computed: {
        isOptgroup() {
            return isPlainObject(this.options);
        },
        id() {
            return `field-dynamic-${name}`;
        }
    }
};
</script>

<template>
    <div class="u-margin-bottom-s">
        <label class="ff-label" :for="id">
            {{ label }}
        </label>
        <select
            class="ff-select"
            :name="name" :id="'field-dynamic-' + name"
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

        <div class="u-padded-vertical-s" v-if="value">
            <button type="button" class="btn-link" @click="$emit('clear-selection')">
                {{ copy.filters.clearSelection }}
            </button>
        </div>
    </div>
</template>
