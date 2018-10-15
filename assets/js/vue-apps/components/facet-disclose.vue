<script>
export default {
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
            {{ isOpen ? 'See fewer options' : 'See more options' }}
        </button>
    </div>
</template>
