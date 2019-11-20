<script>
import { tagHotjarRecording } from '../../helpers/metrics';

export default {
    props: {
        currentText: { type: String, default: '' },
        maxWords: { type: Number, required: true },
        minWords: { type: Number, required: true },
        formShortId: { type: String, default: null }
    },
    methods: {
        /**
         * Count words
         * Matches consecutive non-whitespace chars
         * If changing match this with validators.js
         * @param {string} text
         */
        countWords(text) {
            if (text) {
                const tokens = text.trim().match(/\S+/g) || [];
                return tokens.length;
            } else {
                return 0;
            }
        }
    },
    computed: {
        currentCount() {
            return this.countWords(this.currentText);
        },
        isOverLimit() {
            return this.currentCount > this.maxWords;
        },
        amountOver() {
            if (this.isOverLimit) {
                return this.currentCount - this.maxWords;
            } else {
                return 0;
            }
        },
        currentCountMessage() {
            return this.$t('wordCounter.currentCount', {
                currentCount: this.currentCount,
                maxWords: this.maxWords
            });
        },
        helpMessage() {
            if (this.isOverLimit) {
                return this.$t('wordCounter.overLimit', {
                    amountOver: this.amountOver
                });
            } else if (this.currentCount < this.minWords) {
                return this.$t('wordCounter.defaultMessage', {
                    minWords: this.minWords
                });
            } else {
                return '';
            }
        }
    },
    watch: {
        isOverLimit(isOver) {
            if (isOver) {
                tagHotjarRecording([
                    `Apply: ${this.formShortId}: Your Idea: Word count exceeded`
                ]);
            }
        }
    }
};
</script>

<template>
    <div
        class="word-count"
        :class="{ 'word-count--over': isOverLimit }"
        role="region"
        aria-live="polite"
        aria-atomic="true"
        data-testid="word-count"
    >
        <span class="word-count__counter" v-html="currentCountMessage"></span>
        <span class="word-count__message" v-html="helpMessage"></span>
    </div>
</template>
