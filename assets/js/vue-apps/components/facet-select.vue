<script>
export default {
    props: ['value', 'name', 'label', 'labelAny', 'options']
};
</script>

<template>
    <div>
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
                v-bind:key="option.value"
                :value="option.value">
                {{ option.label }}
            </option>
        </select>

        <button class="btn-link" v-if="value"
            @click="$emit('clear-choice')">
            Clear {{ label.toLowerCase() }}
        </button>
    </div>
</template>
