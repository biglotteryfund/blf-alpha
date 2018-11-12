<script>
import { storageAvailable, getWithExpiry } from '../../helpers/storage';
import IconArrowLeft from './icon-arrow-left.vue';
const canStore = storageAvailable('localStorage');

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
        if (canStore) {
            const searchData = getWithExpiry({ type: 'localStorage', key: this.storageKey });
            if (searchData) {
                this.returnLink = this.prefix + '?' + searchData;
            }
        }
    }
};
</script>

<template>
    <p class="u-no-margin"
       v-if="returnLink">
        <a class="btn btn--small btn--outline accent--pink"
           :href="this.returnLink">
                <span class="btn__icon btn__icon-left">
                    <IconArrowLeft
                        :id="'back-to-search-' + id"
                        :description="label"
                    />
                </span>
            {{ label }}
        </a>
    </p>
</template>
