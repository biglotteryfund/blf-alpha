<script>
import sumBy from 'lodash/sumBy';
import IconBin from './icon-bin.vue';

export default {
    components: { IconBin },
    props: {
        fieldName: { type: String, required: true },
        maxBudget: { type: Number, required: true },
        maxItems: { type: Number, required: true },
        budgetData: { type: Array, required: false }
    },
    mounted() {
        if (this.budgetData) {
            this.budgetRows = this.budgetData;
        } else {
            this.addNewItem();
        }
    },
    data() {
        return {
            budgetRows: [],
            error: {}
        };
    },
    computed: {
        total() {
            return sumBy(this.budgetRows, row => parseInt(row.cost || 0));
        }
    },
    watch: {
        budgetRows: {
            handler() {
                if (this.shouldCreateNewRow()) {
                    this.addNewItem();
                }
                this.error.TOO_MANY_ITEMS = this.budgetRows.length === this.maxItems;
                this.error.OVER_BUDGET = this.maxBudget && this.total > this.maxBudget;
            },
            deep: true
        }
    },
    methods: {
        addNewItem() {
            this.budgetRows.push({ item: '', cost: '' });
        },
        removeItem(item) {
            this.budgetRows = this.budgetRows.filter(i => i !== item);
        },
        shouldCreateNewRow() {
            const lastItem = this.budgetRows[this.budgetRows.length - 1];
            return this.budgetRows.length < this.maxItems && lastItem.item || lastItem.cost;
        },
        getLineItemName(index, subFieldName) {
            return `${this.fieldName}[${index}][${subFieldName}]`;
        },
        canDelete(index) {
            return this.budgetRows.length > 1 && index !== this.budgetRows.length - 1;
        }
    }
};
</script>

<!-- If we update this we should change the Nunjucks component too -->
<template>
    <div class="ff-budget">
        <ol class="ff-budget__list">
            <li class="ff-budget__row" v-for="(lineItem, index) in budgetRows" :key="index">
                <div class="ff-budget__row-item">
                    <label class="ff-label" :for="getLineItemName(index, 'item')">
                        Item or activity
                    </label>
                    <input
                        class="ff-text u-block-full"
                        type="text"
                        :name="getLineItemName(index, 'item')"
                        :id="getLineItemName(index, 'item')"
                        autocomplete="off"
                        v-model="lineItem.item"
                    />
                </div>
                <div class="ff-budget__row-amount">
                    <label class="ff-label" :for="getLineItemName(index, 'cost')">
                        Amount
                    </label>
                    <div class="ff-currency">
                        <div class="ff-currency__pre">£</div>
                        <input
                            type="number"
                            :name="getLineItemName(index, 'cost')"
                            :id="getLineItemName(index, 'cost')"
                            v-model="lineItem.cost"
                            min="1"
                            step="1"
                            :max="maxBudget"
                            class="ff-currency__input"
                        />
                    </div>
                </div>
                <div class="ff-budget-row__action">
                    <button
                        class="btn btn--small btn--outline"
                        type="button"
                        @click="removeItem(lineItem)"
                        v-if="canDelete(index)"
                    >
                        <span class="btn__icon btn__icon-left">
                            <IconBin id="delete-icon" description="Delete this row" />
                        </span>
                        Delete row
                    </button>
                </div>
            </li>
        </ol>

        <div class="ff-budget__errors" aria-live="polite" aria-atomic="true">
            <!-- @TODO localise -->
            <p v-if="error.TOO_MANY_ITEMS">
                You have added the maximum number of budget rows available ({{ maxItems }}).
            </p>
            <p v-if="error.OVER_BUDGET">
                You have exceeded the budget limit for this application of £{{ maxBudget.toLocaleString() }}.
            </p>
        </div>

        <dl class="ff-budget__total" aria-live="polite" aria-atomic="true">
            <dt class="ff-budget__total-label">Total</dt>
            <dd class="ff-budget__total-amount">£{{ total.toLocaleString() }}</dd>
        </dl>
    </div>
</template>
