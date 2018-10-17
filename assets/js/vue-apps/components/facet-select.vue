<script>
export default {
    props: ['value', 'name', 'label', 'labelAny', 'options'],
    computed: {
        id() {
            return `field-dynamic-${name}`;
        }
    }
};
</script>

<template>
    <div class="u-margin-bottom-s" v-if="options.length > 0">
        <label class="ff-label" :for="id">
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
                :key="option.label"
                :value="option.value">
                {{ option.label }}
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
