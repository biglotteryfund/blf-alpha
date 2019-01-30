<script>
import { getWithExpiry } from '../../helpers/storage';
import IconArrowLeft from './icon-arrow-left.vue';

export default {
    components: { IconArrowLeft },
    props: ['label', 'storageKey', 'prefix'],
    data() {
        return {
            returnLink: undefined
        };
    },
    computed: {
        id() {
            return Math.random()
                .toString(36)
                .substr(2, 9);
        }
    },
    mounted: function() {
        const searchData = getWithExpiry({ type: 'localStorage', key: this.storageKey });
        if (searchData) {
            this.returnLink = this.prefix + '?' + searchData;
        }
    }
};
</script>

<template>
    <a class="btn btn--small btn--outline" :href="returnLink" v-if="returnLink">
        <span class="btn__icon btn__icon-left">
            <IconArrowLeft :id="'back-to-search-' + id" :description="label" />
        </span>
        {{ label }}
    </a>
</template>
