<script>
import IconClose from './icon-close.vue';
export default {
    components: { IconClose },
    props: ['filters', 'clearLabel']
};
</script>

<template>
    <div>
        <ul class="filter-list">
            <li v-for="(value, key) in filters"
                :key="key"
                @click="$emit('clear-filters', key)"
                class="filter-list__item">
                {{ value }}
                <IconClose id="prompt-close" description="Dismiss prompt" />
            </li>
            <li v-if="Object.keys(filters).length > 0">
                <button type="button" class="btn-link" @click="$emit('clear-filters')">
                    {{ clearLabel }}
                </button>
            </li>
        </ul>
    </div>
</template>
