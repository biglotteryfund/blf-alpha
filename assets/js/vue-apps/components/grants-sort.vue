<script>
import FacetSelect from './facet-select.vue';

export default {
    props: ['query', 'sort'],
    components: { FacetSelect },
    data() {
        const sortOptions = [
            {
                label: 'Most recent',
                value: 'awardDate|desc'
            },
            {
                label: 'Oldest first',
                value: 'awardDate|asc'
            },
            {
                label: 'Lowest amount first',
                value: 'amountAwarded|asc'
            },
            {
                label: 'Highest amount first',
                value: 'amountAwarded|desc'
            }
        ];

        if (this.query) {
            sortOptions.unshift({
                label: 'Most relevant',
                value: ''
            });
        }

        return { sortOptions };
    },
    methods: {
        handleSort(e) {
            this.$emit('sort-grants', e.target.value);
        }
    }
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
            :value="sort"
            @input="handleSort">
            <option
                v-for="option in sortOptions"
                v-bind:key="option.label"
                :value="option.value">
                {{ option.label }}
            </option>
        </select>
    </div>
</template>
