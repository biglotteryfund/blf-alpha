<script>
export default {
    props: ['labelOpen', 'labelClosed', 'initialOpen', 'trackUi', 'filterName'],
    data() {
        return { isOpen: this.initialOpen };
    },
    computed: {
        ariaId() {
            return `facet-disclose-${Math.random().toString(36).substr(2, 9)}`;
        },
    },
    methods: {
        toggle() {
            this.isOpen = !this.isOpen;
            let action = 'Toggle disclose ';
            action += this.isOpen ? 'on' : 'off';
            this.trackUi(action, this.filterName);
        },
    },
};
</script>

<template>
    <div :aria-expanded="isOpen ? 'true' : 'false'" :aria-controls="ariaId">
        <div
            v-show="isOpen"
            :id="ariaId"
            :aria-hidden="isOpen ? 'false' : 'true'"
        >
            <slot></slot>
        </div>
        <button class="btn-link u-margin-bottom" type="button" @click="toggle">
            {{ isOpen ? labelOpen : labelClosed }}
        </button>
    </div>
</template>
