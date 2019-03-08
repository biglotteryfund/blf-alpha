import Vue from 'vue';
import CharacterCount from './components/character-count.vue';
import $ from 'jquery';
import isEmpty from 'lodash/isEmpty';

function initCharacterCount() {
    const el = document.querySelector('.js-character-count');
    if (el) {
        new Vue({
            el: el,
            data: {
                // Assumes a v-model on the input within the component template
                text: null
            },
            components: {
                'character-count': CharacterCount
            }
        });
    }
}

function initBudgetInput() {
    const mountEl = document.getElementById('js-vue-budget');
    if (!mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data() {
            return {
                maxItems: null,
                maxBudget: null,
                items: [],
                fieldName: null,
                ready: false,
                error: null
            };
        },
        watch: {
            items: {
                handler() {
                    const lastItem = this.items[this.items.length - 1];
                    if (lastItem) {
                        if (this.items.length < this.maxItems && (!isEmpty(lastItem.item) || !isEmpty(lastItem.cost))) {
                            this.addItem();
                        }
                    }
                    if (this.items.length === this.maxItems) {
                        this.setError('TOO_MANY_ITEMS');
                    } else {
                        this.clearError();
                    }
                },
                deep: true
            }
        },
        mounted: function() {
            // Clear out <noscript> fallbacks otherwise they submit as well as the
            // Vue-enhanced fields (eg. double inputs)
            $(this.$el)
                .find('noscript')
                .remove();

            // Parse config via data attributes
            let budgetData = this.$el.getAttribute('data-budget');
            let fieldName = this.$el.getAttribute('data-field-name');
            let maxBudget = this.$el.getAttribute('data-max-budget');
            let maxItems = this.$el.getAttribute('data-max-items');

            if (budgetData) {
                this.items = JSON.parse(budgetData);
            } else {
                this.addItem();
            }

            if (fieldName) {
                this.fieldName = fieldName;
            }

            if (maxBudget) {
                this.maxBudget = maxBudget;
            }

            this.maxItems = maxItems ? maxItems : 10;

            // Activate disabled fields (which are disabled to avoid non-JS double submit)
            this.ready = true;
        },
        computed: {
            total() {
                const total = this.items.reduce((acc, cur) => {
                    return acc + (parseInt(cur.cost || 0) || 0);
                }, 0);
                if (this.maxBudget && total > this.maxBudget) {
                    this.setError('OVER_BUDGET');
                } else {
                    this.clearError();
                }
                return '£' + total;
            }
        },
        methods: {
            setError: function(errState) {
                this.error = errState;
            },
            clearError: function() {
                this.error = null;
            },
            addItem: function(item = { item: '', cost: '', isNew: true }) {
                this.items.push(item);
            },
            removeItem: function(item) {
                this.items = this.items.filter(i => i !== item);
            },
            getLineItemName: function(index, subFieldName) {
                return `${this.fieldName}[${index}][${subFieldName}]`;
            }
        }
    });
}

function init() {
    initCharacterCount();
    initBudgetInput();
}

export default {
    init
};
