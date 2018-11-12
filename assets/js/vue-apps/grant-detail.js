import Vue from 'vue';

import GrantsRelated from './components/grants-related.vue';
import GrantsBackToSearch from './components/grants-back-to-search.vue';

function init(STORAGE_KEY) {
    const mountEl = document.getElementById('js-past-grants-detail');

    if (!mountEl) {
        return;
    }
    new Vue({
        el: mountEl,
        data: {
            STORAGE_KEY: STORAGE_KEY
        },
        components: {
            'grants-related': GrantsRelated,
            'grants-back-to-search': GrantsBackToSearch
        }
    });
}

export default {
    init
};
