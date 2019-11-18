<script>
export default {
    props: ['sort', 'label']
};
</script>

<template>
    <div class="sort-controls">
        <label class="sort-controls__label" for="field-sort">
            {{ label }}
        </label>
        <select
            class="sort-controls__select"
            name="sort"
            id="field-sort"
            :value="sort.activeSort"
            @change="$emit('change-sort', $event.target.value)"
        >
            <option
                v-for="option in sort.sortOptions"
                :key="option.label"
                :value="option.value"
            >
                {{ option.label }}
            </option>
        </select>
    </div>
</template>
