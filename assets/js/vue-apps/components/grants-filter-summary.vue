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
                {{ value }} ({{ key }})
                <IconClose id="prompt-close" description="Dismiss prompt" />
            </li>
            <li>
                <button type="button" class="btn-link" @click="$emit('clear-filters')">
                    {{ clearLabel }}
                </button>
            </li>
        </ul>
    </div>
</template>
