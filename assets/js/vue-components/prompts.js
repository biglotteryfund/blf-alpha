import { IconClose } from './icons';
import { includes } from 'lodash';
import $ from 'jquery';
import Vue from 'vue';

const PromptWrapper = {
    components: {
        'icon-close': IconClose
    },
    props: {
        prompt: {
            type: Object,
            required: true
        },
        delay: {
            default: 8000,
            type: Number
        }
    },
    data() {
        return {
            isShown: false
        };
    },
    mounted: function() {
        if (includes(this.getSeen(), this.prompt.id) === false) {
            setTimeout(() => (this.isShown = true), this.delay);
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
    },
    template: `
<aside role="complementary" class="prompt" v-bind:class="{ 'is-shown': isShown }">
    <div class="prompt__body">
        <div class="prompt__content">
            <slot></slot>
        </div>
        <span class="prompt__close">
            <button class="icon-btn" v-on:click="closePrompt()"
                data-ga-on="click"
                :data-ga-event-category="'Prompt: ' + this.prompt.id"
                data-ga-event-action="Dismissed prompt"
                aria-label="Dismiss prompt">
                <icon-close id="prompt-close" description="Dismiss prompt" />
            </button>
        </span>
    </div>
</aside>
`
};

function init() {
    new Vue({
        el: '#js-active-prompt',
        components: {
            'prompt-wrapper': PromptWrapper
        },
        data() {
            return { activePrompt: null };
        },
        created() {
            const localePrefix = window.AppConfig.localePrefix;
            $.getJSON(`${localePrefix}/prompts`).then(response => {
                this.activePrompt = response.prompt;
            });
        },
        template: `
            <prompt-wrapper :prompt=this.activePrompt v-if="activePrompt && Math.random() < activePrompt.weight">
                {{ activePrompt.message }}
                <a :href="activePrompt.link.href"
                    data-ga-on="click"
                    :data-ga-event-category="'Prompt: ' + this.activePrompt.id"
                    data-ga-event-action="Took action">
                    {{ activePrompt.link.label }}
                </a>
            </prompt-wrapper>
        `
    });
}

export default {
    init
};
