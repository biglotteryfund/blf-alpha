<script>
export default {
    props: ['value', 'clearLabel']
};
</script>

<template>
    <div class="facet-group">
        <slot></slot>

        <button class="btn-link u-padded-top-s"
            @click="$emit('clear-choice')" v-if="value">
            {{ clearLabel }}
        </button>
    </div>
</template>
