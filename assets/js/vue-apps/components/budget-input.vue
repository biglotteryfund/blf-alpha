<script>
import isEmpty from 'lodash/isEmpty';
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
        if (!this.budgetData) {
            this.addItem();
        } else {
            this.budgetRows = this.budgetData;
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
            return this.budgetRows.reduce((acc, cur) => {
                return acc + parseInt(cur.cost || 0);
            }, 0);
        }
    },
    watch: {
        budgetRows: {
            handler() {
                if (this.shouldCreateNewRow()) {
                    this.addItem();
                }
                this.error.TOO_MANY_ITEMS = this.budgetRows.length === this.maxItems;
                this.error.OVER_BUDGET = this.maxBudget && this.total > this.maxBudget;
            },
            deep: true
        }
    },
    methods: {
        addItem: function(item = { item: '', cost: '', isNew: true }) {
            this.budgetRows.push(item);
        },
        removeItem: function(item) {
            this.budgetRows = this.budgetRows.filter(i => i !== item);
        },
        shouldCreateNewRow: function() {
            const lastItem = this.budgetRows[this.budgetRows.length - 1];
            return (
                lastItem &&
                this.budgetRows.length < this.maxItems &&
                (!isEmpty(lastItem.item) || !isEmpty(lastItem.cost))
            );
        },
        getLineItemName: function(index, subFieldName) {
            return `${this.fieldName}[${index}][${subFieldName}]`;
        }
    }
};
</script>

<!-- If we update this we should change the Vue component too -->
<template>
    <div class="ff-budget">
        <table class="ff-budget__table">
            <thead>
                <tr>
                    <th scope="col" class="ff-budget__item-col">Item or activity</th>
                    <th scope="col">Amount from us</th>
                    <th scope="col" class="ff-budget__actions"></th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(lineItem, index) in budgetRows"
                    :aria-live="lineItem.isNew ? 'polite' : false"
                    :key="index"
                    v-cloak
                >
                    <td>
                        <input
                            type="text"
                            autocomplete="off"
                            :name="getLineItemName(index, 'item')"
                            v-model="lineItem.item"
                            placeholder="Add item name"
                            class="ff-text u-block-full"
                        />
                    </td>
                    <td>
                        <div class="ff-field-prepend">£</div>
                        <input
                            type="number"
                            :name="getLineItemName(index, 'cost')"
                            v-model="lineItem.cost"
                            min="1"
                            :max="maxBudget"
                            class="ff-text ff-text--currency"
                        />
                    </td>
                    <td v-if="index > 0 && index !== budgetRows.length - 1">
                        <button
                            class="btn btn--small btn--outline u-block-full"
                            type="button"
                            @click="removeItem(lineItem)"
                        >
                            <IconBin id="delete-icon" description="Delete this row" />
                            Delete row
                        </button>
                    </td>
                </tr>

                <tr v-if="error" v-cloak>
                    <td class="ff-budget__error">
                        <!-- @TODO localise -->
                        <span v-if="error.TOO_MANY_ITEMS">
                            You have added the maximum number of budget rows available ({{ maxItems }}).
                        </span>
                        <span v-if="error.OVER_BUDGET">
                            You have exceeded the budget limit for this application of £{{
                                maxBudget.toLocaleString()
                            }}.
                        </span>
                    </td>
                </tr>
            </tbody>

            <tfoot v-cloak>
                <tr>
                    <td><span class="ff-budget__label">Total:</span></td>
                    <td>
                        <span class="ff-budget__total" tabindex="0">£{{ total }}</span>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
