<script>
export default {
    props: ['labelOpen', 'labelClosed'],
    data() {
        return { isOpen: false };
    }
};
</script>

<template>
    <div>
        <template v-if="isOpen">
            <slot></slot>
        </template>
        <button class="btn-link" type="button" @click="isOpen = !isOpen">
            {{ isOpen ? labelOpen : labelClosed }}
        </button>
    </div>
</template>
