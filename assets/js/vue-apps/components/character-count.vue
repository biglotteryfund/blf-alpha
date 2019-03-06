<script>
export default {
    props: ['maxWords', 'currentText', 'locale'],
    methods: {
        count(text) {
            if (text) {
                // Matches consecutive non-whitespace chars
                const tokens = text.match(/\S+/g) || [];
                return tokens.length;
            } else {
                return 0;
            }
        }
    },
    computed: {
        currentCount() {
            return this.count(this.currentText);
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
        message() {
            if (this.amountOver > 0) {
                return {
                    en: `You have <strong>${this.amountOver}</strong> words too many`,
                    cy: 'Welsh'
                }[this.locale];
            } else {
                return {
                    en: `<strong>${this.currentCount}</strong> / ${
                        this.maxWords
                    } words. You have a maximum of <strong>${this.wordsRemaining}</strong> words remaining`,
                    cy: 'Welsh'
                }[this.locale];
            }
        }
    }
};
</script>

<template>
    <div class="character-count u-margin-top" role="region" aria-live="polite" v-html="message"></div>
</template>
