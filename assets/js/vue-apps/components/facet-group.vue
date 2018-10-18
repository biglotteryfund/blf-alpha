<script>
import IconArrowDown from './icon-arrow-down.vue';
export default {
    props: ['id', 'legend'],
    components: { IconArrowDown },
    data() {
        return { isOpen: true };
    }
};
</script>

<template>
    <div class="facet-group" :class="{ 'is-open': isOpen }">
        <fieldset class="facet-group__fieldset">
            <button class="facet-group__toggle" type="button" @click="isOpen = !isOpen">
                <IconArrowDown :id="'facet-' + id" :description="'Toggle ' + legend" />
                <span class="u-visually-hidden">Toggle {{ legend }}</span>
            </button>
            <legend class="facet-group__legend">
                {{ legend }}
            </legend>
            <div class="facet-group__body">
                <slot></slot>
            </div>
        </fieldset>
    </div>
</template>
