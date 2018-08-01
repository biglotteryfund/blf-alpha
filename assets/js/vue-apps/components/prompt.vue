<script>
const { trackEvent } = require('../../helpers/metrics');
import $ from 'jquery';
import includes from 'lodash/includes';
import IconClose from './icon-close.vue';

export default {
    components: { IconClose },
    data() {
        return { isShown: false, prompt: null };
    },
    created() {
        const localePrefix = window.AppConfig.localePrefix;
        $.getJSON(`${localePrefix}/prompts`).then(response => {
            this.prompt = response.prompt;
            setTimeout(() => {
                this.isShown = true;
                trackEvent(`Prompt: ${this.prompt.id}`, 'Shown prompt');
            }, 8000);
        });
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
            if (includes(seenIds, this.prompt.id) === false) {
                try {
                    seenIds.push(this.prompt.id);
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
    <aside role="complementary" class="prompt" v-bind:class="{ 'is-shown': isShown }"
        v-if="prompt && Math.random() < prompt.weight">
        <div class="prompt__body">
            <div class="prompt__content">
                {{ prompt.message }}
                <a :href="prompt.link.href"
                    data-ga-on="click"
                    :data-ga-event-category="'Prompt: ' + prompt.id"
                    data-ga-event-action="Took action">
                    {{ prompt.link.label }}
                </a>
            </div>
            <span class="prompt__close">
                <button class="icon-btn" v-on:click="closePrompt()"
                    data-ga-on="click"
                    :data-ga-event-category="'Prompt: ' + prompt.id"
                    data-ga-event-action="Dismissed prompt"
                    aria-label="Dismiss prompt">
                    <IconClose id="prompt-close" description="Dismiss prompt" />
                </button>
            </span>
        </div>
    </aside>
</template>
