<script>
import sumBy from 'lodash/sumBy';
import concat from 'lodash/concat';
import IconBin from '../components/icon-bin.vue';

import { trackEvent } from '../../helpers/metrics';

export default {
    components: { IconBin },
    props: {
        fieldName: { type: String, required: true },
        maxBudget: { type: Number, required: true },
        maxItems: { type: Number, required: true },
        budgetData: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            budgetRows: concat(this.budgetData, [{ item: '', cost: '' }]),
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
                if (this.shouldAddNewRow()) {
                    this.addRow();
                }
                this.error.TOO_MANY_ITEMS =
                    this.budgetRows.length === this.maxItems;
                this.error.OVER_BUDGET =
                    this.maxBudget && this.total > this.maxBudget;

                if (this.error.OVER_BUDGET) {
                    trackEvent('Budget Component', 'Error', 'Over budget');
                }

                if (this.error.TOO_MANY_ITEMS) {
                    trackEvent('Budget Component', 'Error', 'Maximum number of items reached');
                }

            },
            deep: true
        },
    },
    methods: {
        getLineItemName(index, subFieldName) {
            return `${this.fieldName}[${index}][${subFieldName}]`;
        },
        shouldAddNewRow() {
            const lastItem = this.budgetRows[this.budgetRows.length - 1];
            return lastItem.item || lastItem.cost;
        },
        addRow() {
            if (this.budgetRows.length < this.maxItems) {
                this.budgetRows.push({ item: '', cost: '' });
            }
        },
        removeItem(item) {
            this.budgetRows = this.budgetRows.filter(i => i !== item);
        },
        canDelete(index) {
            return (
                this.budgetRows.length > 1 &&
                index !== this.budgetRows.length - 1
            );
        }
    }
};
</script>

<!-- If we update this we should change the Nunjucks component too -->
<template>
    <div class="ff-budget">
        <ol class="ff-budget__list">
            <li
                class="ff-budget__row"
                v-for="(lineItem, index) in budgetRows"
                :key="index"
                data-testid="budget-row"
            >
                <div class="ff-budget__row-item">
                    <label
                        class="ff-label"
                        :for="getLineItemName(index, 'item')"
                    >
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
                    <label
                        class="ff-label"
                        :for="getLineItemName(index, 'cost')"
                    >
                        Amount
                    </label>
                    <div class="ff-currency ff-currency--row">
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
                            <IconBin
                                :id="'delete-icon-' + index"
                                description="Delete this row"
                            />
                        </span>
                        Delete row
                        <span class="u-visually-hidden">
                            "{{ lineItem.item }}" (row {{ index + 1 }})
                        </span>
                    </button>
                </div>
            </li>
        </ol>

        <div
            class="ff-budget__errors"
            aria-live="polite"
            aria-atomic="true"
            data-testid="budget-errors"
        >
            <!-- @TODO localise -->
            <p v-if="error.TOO_MANY_ITEMS">
                You must use {{ maxItems }} budget headings or fewer to tell us
                your costs
            </p>
            <p v-if="error.OVER_BUDGET">
                Costs you would like us to fund must be less than £{{
                    maxBudget.toLocaleString()
                }}.
            </p>
        </div>

        <dl
            class="ff-budget__total"
            aria-live="polite"
            aria-atomic="true"
            data-testid="budget-total"
        >
            <dt class="ff-budget__total-label">Total</dt>
            <dd class="ff-budget__total-amount">
                £{{ total.toLocaleString() }}
            </dd>
        </dl>
    </div>
</template>
