<script>
import IconClose from './icon-close.vue';
export default {
    components: { IconClose },
    props: ['filterSummary', 'clearLabel']
};
</script>

<template>
    <div>
        <ul class="filter-list">
            <li v-for="item in filterSummary"
                :key="item.name"
                @click="$emit('clear-filters', item.name)"
                class="filter-list__item">
                {{ item.label }}
                <IconClose id="prompt-close" description="Dismiss prompt" />
            </li>
            <li v-if="filterSummary.length > 0">
                <button type="button" class="btn-link" @click="$emit('clear-filters')">
                    {{ clearLabel }}
                </button>
            </li>
        </ul>
    </div>
</template>
