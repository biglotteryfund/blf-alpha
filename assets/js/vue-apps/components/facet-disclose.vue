<script>
export default {
    props: ['labelOpen', 'labelClosed'],
    data() {
        return { isOpen: false };
    },
    computed: {
        id() {
            return Math.random().toString(36).substr(2, 9);
        },
        ariaId() {
            return `facet-disclose-${this.id}`;
        }
    }
};
</script>

<template>
    <div :aria-expanded="isOpen ? 'true' : 'false'" :aria-controls="ariaId">
        <div v-show="isOpen" :id="ariaId" :aria-hidden="isOpen ? 'false' : 'true'">
            <slot></slot>
        </div>
        <button class="btn-link" type="button" @click="isOpen = !isOpen">
            {{ isOpen ? labelOpen : labelClosed }}
        </button>
    </div>
</template>
