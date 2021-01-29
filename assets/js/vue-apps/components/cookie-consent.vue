<script>
import { storageAvailable } from '../../helpers/storage';
import { trackEvent } from '../../helpers/metrics';

const canStore = storageAvailable('localStorage');
const STORAGE_KEY = 'tnlcommunityfund:cookie-consent';

export default {
    props: ['title', 'message', 'actionall', 'actionessential', 'policyurl'],
    data() {
        const hasAccepted =
            canStore && (window.localStorage.getItem(STORAGE_KEY) === 'all' || window.localStorage.getItem(STORAGE_KEY) === 'essential');
        return { isShown: hasAccepted === false };
    },
    methods: {
        handleAcceptAll() {
            canStore && window.localStorage.setItem(STORAGE_KEY, 'all');
            trackEvent('Cookie Warning', 'Click', 'Accept all');
            this.isShown = false;
        },
        handleAcceptEssential() {
            canStore && window.localStorage.setItem(STORAGE_KEY, 'essential');
            trackEvent('Cookie Warning', 'Click', 'Essential cookies only');
            this.isShown = false;
        },
    },
};
</script>

<template>
    <aside class="cookie-consent u-dont-print" :class="{ 'is-shown': isShown }">
        <div class="cookie-consent__inner">
            <div class="cookie-consent__content" v-html="message"></div>
            <div class="cookie-consent__actions">
                <button class="btn btn--small" @click="handleAcceptAll">
                    {{ actionall }}
                </button>

                <a v-if="policyurl == 'english'" class="btn btn--small" @click="handleAcceptEssential" href="/about/customer-service/cookies">
                    {{ actionessential }}
                </a>
                <a v-else class="btn btn--small" @click="handleAcceptEssential" href="welsh/about/customer-service/cookies">
                    {{ actionessential }}
                </a>
            </div>
        </div>
    </aside>
</template>
