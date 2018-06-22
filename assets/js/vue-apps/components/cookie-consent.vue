<script>
import $ from 'jquery';
import { storageAvailable } from '../../helpers/storage';
const { trackEvent } = require('../../helpers/metrics');

const canStore = storageAvailable('localStorage');
const STORAGE_KEY = 'biglotteryfund:cookie-consent';

export default {
    props: ['lang'],
    data() {
        const hasAccepted = canStore && window.localStorage.getItem(STORAGE_KEY) === 'true';
        return { isShown: hasAccepted === false };
    },
    methods: {
        handleAccept() {
            canStore && window.localStorage.setItem(STORAGE_KEY, 'true');
            trackEvent('Cookie Warning', 'Click', 'Accept');
            this.isShown = false;
        }
    }
};
</script>

<template>
    <aside class="cookie-consent" v-bind:class="{ 'is-shown': isShown }" v-if="lang">
        <div class="cookie-consent__inner">
            <div class="cookie-consent__content">
                <h4 class="cookie-consent__title">{{ lang.title }}</h4>
                <div class="cookie-consent__message" v-html="lang.message"></div>
            </div>
            <div class="cookie-consent__actions">
                <button class="btn btn--small" @click="handleAccept()">{{ lang.action }}</button>
            </div>
        </div>
    </aside>
</template>
