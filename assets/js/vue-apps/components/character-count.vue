<script>
export default {
    props: {
        currentText: { type: String, default: '' },
        maxWords: { type: Number, required: true },
        minWords: { type: Number, default: 0 },
        locale: { type: String, required: true }
    },
    methods: {
        /**
         * Count words
         * Matches consecutive non-whitespace chars
         * If changing match this with character-count.vue
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
        wordsRemaining() {
            return this.maxWords - this.currentCount;
        },
        amountOver() {
            if (this.currentCount > this.maxWords) {
                return this.currentCount - this.maxWords;
            } else {
                return 0;
            }
        },
        overLimitMessage() {
            return {
                en: `You have <strong>${this.amountOver}</strong> words too many.`,
                cy: 'Welsh'
            }[this.locale];
        },
        wordCountMessage() {
            const currentCountMessage = {
                en: `<strong>${this.currentCount}</strong> / ${this.maxWords} words`,
                cy: ''
            }[this.locale];

            const minimumMessage = {
                en: `Must be at least <strong>${this.minWords}</strong> words`,
                cy: 'Welsh'
            }[this.locale];

            const wordsRemainingMessage = {
                en: `You have a maximum of <strong>${this.wordsRemaining}</strong> words remaining`,
                cy: ''
            }[this.locale];

            if (this.currentCount < this.minWords) {
                return `${currentCountMessage}. ${minimumMessage}. ${wordsRemainingMessage}.`;
            } else {
                return `${currentCountMessage}. ${wordsRemainingMessage}.`;
            }
        },
        message() {
            if (this.amountOver > 0) {
                return this.overLimitMessage;
            } else {
                return this.wordCountMessage;
            }
        }
    }
};
</script>

<template>
    <div
        class="character-count u-margin-top"
        role="region"
        aria-live="polite"
        aria-atomic="true"
        data-testid="word-count"
        v-html="message"
    ></div>
</template>
