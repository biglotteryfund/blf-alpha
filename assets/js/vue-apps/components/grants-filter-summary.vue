<script>
import IconClose from './icon-close.vue';
export default {
    components: { IconClose },
    props: ['filterSummary', 'clearLabel']
};
</script>

<template>
    <ul class="filter-list">
        <li
            class="filter-list__item"
            v-for="item in filterSummary"
            :key="item.name"
        >
            <button
                class="active-filter"
                @click="$emit('clear-filters', item.name)"
                :title="item.name"
            >
                {{ item.label }}
                <IconClose id="prompt-close" description="Remove this filter" />
            </button>
        </li>
        <li class="filter-list__item" v-if="filterSummary.length > 0">
            <button type="button" class="btn-link" @click="$emit('clear-all')">
                {{ clearLabel }}
            </button>
        </li>
    </ul>
</template>
