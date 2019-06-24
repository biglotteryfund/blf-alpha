<script>
export default {
    props: {
        currentText: { type: String, default: '' },
        maxWords: { type: Number, required: true },
        minWords: { type: Number, required: true },
        recommendedWords: { type: Number, required: true },
        locale: { type: String, required: true }
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
            return {
                en: `${this.currentCount} / ${this.maxWords} words`,
                cy: ''
            }[this.locale];
        },
        helpMessage() {
            if (this.isOverLimit) {
                return {
                    en: `You have <strong>${this.amountOver} words</strong> too many.`,
                    cy: 'Welsh'
                }[this.locale];
            } else if (this.currentCount < this.minWords) {
                return {
                    en: `Must be at least ${this.minWords} words. You can write up to ${this.maxWords} words for this section, but don't worry if you use less.`,
                    cy: 'Welsh'
                }[this.locale];
            } else {
                return {
                    en: `You can write up to ${this.maxWords} words for this section, but don't worry if you use less`,
                    cy: 'Welsh'
                }[this.locale];
            }
        }
    }
};
</script>

<template>
    <div class="word-count" :class="{ 'word-count--over': isOverLimit }" role="region" aria-live="polite" aria-atomic="true" data-testid="word-count">
        <span class="word-count__counter" v-html="currentCountMessage"></span>
        <span class="word-count__message" v-html="helpMessage"></span>
    </div>
</template>
