import { IconClose } from './icons';
import { includes } from 'lodash';
import $ from 'jquery';
import Vue from 'vue';

const Prompt = {
    components: {
        'icon-close': IconClose
    },
    props: {
        id: {
            type: String,
            required: true
        },
        delay: {
            default: 1000,
            type: Number
        }
    },
    data() {
        return {
            isShown: false
        };
    },
    mounted: function() {
        if (includes(this.getSeen(), this.id) === false) {
            setTimeout(() => (this.isShown = true), this.delay);
        }
    },
    methods: {
        getSeen() {
            let ids = [];
            try {
                const seenIds = window.localStorage.getItem('prompts-seen');
                ids = seenIds ? JSON.parse(seenIds) || [] : [];
            } catch (e) {} // eslint-disable-line no-empty
            return ids;
        },
        setSeen() {
            const seenIds = this.getSeen();
            if (includes(seenIds, this.id) === false) {
                try {
                    seenIds.push(this.id);
                    window.localStorage.setItem('prompts-seen', JSON.stringify(seenIds));
                } catch (e) {} // eslint-disable-line no-empty
            }
        },
        closePrompt() {
            this.isShown = false;
            this.setSeen();
        }
    },
    template: `
<div class="prompt" v-bind:class="{ 'is-shown': isShown }">
    <div class="prompt__body">
        <div class="prompt__content">
            <slot></slot>
        </div>
        <span class="prompt__close">
            <button class="icon-btn" v-on:click="closePrompt()">
                <icon-close id="prompt-close" description="Close prompt"/>
            </button>
        </span>
    </div>
</div>
`
};

function init() {
    new Vue({
        el: '#js-active-prompt',
        components: {
            prompt: Prompt
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
            <prompt id="prompt-message" v-if="activePrompt && Math.random() < activePrompt.weight">
                {{ activePrompt.message }}
                <a :href="activePrompt.link.href">
                    {{ activePrompt.link.label }}
                </a>
            </prompt>
        `
    });
}

export default {
    init
};
