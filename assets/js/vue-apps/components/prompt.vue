<script>
const { trackEvent } = require('../../helpers/metrics');
import $ from 'jquery';
import includes from 'lodash/includes';
import IconClose from './icon-close.vue';

export default {
    components: { IconClose },
    props: ['id', 'weight', 'message', 'linkUrl', 'linkText'],
    data() {
        return { isShown: false };
    },
    created() {
        const promptWeight = parseFloat(this.weight || 1);
        if (Math.random() < promptWeight) {
            setTimeout(() => {
                this.isShown = true;
                trackEvent(`Prompt: ${this.id}`, 'Shown prompt');
            }, 5000);
        }
    },
    methods: {
        getSeen() {
            let ids = [];
            try {
                const seenIds = window.localStorage.getItem('biglotteryfund:prompts-seen');
                ids = seenIds ? JSON.parse(seenIds) || [] : [];
            } catch (e) {} // eslint-disable-line no-empty
            return ids;
        },
        setSeen() {
            const seenIds = this.getSeen();
            if (includes(seenIds, this.id) === false) {
                try {
                    seenIds.push(this.id);
                    window.localStorage.setItem('biglotteryfund:prompts-seen', JSON.stringify(seenIds));
                } catch (e) {} // eslint-disable-line no-empty
            }
        },
        closePrompt() {
            this.isShown = false;
            this.setSeen();
        }
    }
};
</script>

<template>
    <aside role="complementary" class="prompt" v-bind:class="{ 'is-shown': isShown }">
        <div class="prompt__body">
            <div class="prompt__content">
                {{ message }}
                <a :href="linkUrl"
                    data-ga-on="click"
                    :data-ga-event-category="'Prompt: ' + id"
                    data-ga-event-action="Took action">
                    {{ linkText }}
                </a>
            </div>
            <span class="prompt__close">
                <button class="icon-btn" v-on:click="closePrompt()"
                    data-ga-on="click"
                    :data-ga-event-category="'Prompt: ' + id"
                    data-ga-event-action="Dismissed prompt"
                    aria-label="Dismiss prompt">
                    <IconClose id="prompt-close" description="Dismiss prompt" />
                </button>
            </span>
        </div>
    </aside>
</template>
