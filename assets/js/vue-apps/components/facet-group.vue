<script>
import IconArrowDown from './icon-arrow-down.vue';
export default {
    props: {
        'legend': {
            type: String,
            required: true
        },
        'openByDefault': {
            type: Boolean,
            default: true
        }
    },
    components: { IconArrowDown },
    data() {
        return { isOpen: this.openByDefault };
    },
    computed: {
        id() {
            return Math.random().toString(36).substr(2, 9);
        },
        ariaId() {
            return `facet-group-${this.id}`;
        }
    }
};
</script>

<template>
    <div class="facet-group" :class="{ 'is-open': isOpen }" :aria-expanded="isOpen ? 'true' : 'false'" :aria-controls="ariaId">
        <fieldset class="facet-group__fieldset">
            <button class="facet-group__toggle" type="button" @click="isOpen = !isOpen">
                <IconArrowDown :id="'facet-' + id" :description="'Toggle ' + legend" />
                <span class="u-visually-hidden">Toggle {{ legend }}</span>
            </button>
            <legend class="facet-group__legend">
                {{ legend }}
            </legend>
            <div class="facet-group__body"  :id="ariaId" :aria-hidden="isOpen ? 'false' : 'true'">
                <slot></slot>
            </div>
        </fieldset>
    </div>
</template>
