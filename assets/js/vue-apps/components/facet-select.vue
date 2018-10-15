<script>
export default {
    props: ['value', 'name', 'label', 'labelAny', 'options']
};
</script>

<template>
    <div class="u-margin-bottom-s" v-if="options.length > 0">
        <label class="ff-label" :for="'field-dynamic-' + name">
            {{ label }}
        </label>
        <select
            class="ff-select"
            :name="name" :id="'field-dynamic-' + name"
            :value="value"
            @input="$emit('input', $event.target.value)">
            <option value="">{{ labelAny }}</option>
            <option
                v-for="option in options"
                v-bind:key="option.label"
                :value="option.value">
                {{ option.label }} ({{ option.count }})
            </option>
        </select>

        <button type="button"
            class="btn-link"
            v-if="value"
            @click="$emit('clear-selection')"
        >
            Clear selection
        </button>
    </div>
</template>
