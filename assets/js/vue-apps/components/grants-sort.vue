<script>
import FacetSelect from './facet-select.vue';

export default {
    props: ['sort'],
    components: { FacetSelect }
};
</script>

<template>
    <div class="sort-controls">
        <label class="ff-label" for="field-sort">
            Ordered by
        </label>
        <select
            class="ff-select"
            name="sort" id="field-sort"
            :value="sort.activeSort"
            @input="$emit('change-sort', $event.target.value)">
            <option
                v-for="option in sort.sortOptions"
                v-bind:key="option.label"
                :value="option.value">
                {{ option.label }}
            </option>
        </select>
    </div>
</template>
