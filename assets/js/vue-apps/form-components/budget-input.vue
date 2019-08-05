<script>
import sumBy from 'lodash/sumBy';
import get from 'lodash/get';
import concat from 'lodash/concat';
import IconBin from '../components/icon-bin.vue';

import { trackEvent, tagHotjarRecording } from '../../helpers/metrics';

export default {
    components: { IconBin },
    props: {
        fieldName: { type: String, required: true },
        maxBudget: { type: Number, required: true },
        maxItems: { type: Number, required: true },
        i18n: { type: String, default: null },
        budgetData: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        // Add a ready-to-use new row if the budget isn't over the limit already
        const budgetRowsArr =
            this.budgetData.length < this.maxItems
                ? concat(this.budgetData, [{ item: '', cost: '' }])
                : this.budgetData;
        return {
            budgetRows: budgetRowsArr,
            error: {},
            copy: {}
        };
    },
    mounted() {
        if (this.i18n) {
            try {
                this.copy = JSON.parse(this.i18n);
            } catch (e) {} // eslint-disable-line no-empty
        }
        this.checkErrors();
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
                this.checkErrors();
            },
            deep: true
        }
    },
    methods: {
        checkErrors() {
            this.error.TOO_MANY_ITEMS =
                this.budgetRows.length === this.maxItems;
            this.error.OVER_BUDGET =
                this.maxBudget && this.total > this.maxBudget;

                if (this.error.OVER_BUDGET) {
                    trackEvent('Budget Component', 'Error', 'Over budget');
                }

                if (this.error.TOO_MANY_ITEMS) {
                    trackEvent(
                        'Budget Component',
                        'Error',
                        'Maximum number of items reached'
                    );
                }
            },
            deep: true
        }
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
            tagHotjarRecording(['Apply: AFA: Budget: Row deleted']);
            this.budgetRows = this.budgetRows.filter(i => i !== item);
        },
        canDelete(index) {
            return (
                this.budgetRows.length > 1 &&
                index !== this.budgetRows.length - 1
            );
        },
        localise(path) {
            return get(this.copy, `fields.budget.${path}`);
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
                        v-html="localise('item')"
                    >
                    </label>
                    <input
                        class="ff-text u-block-full"
                        type="text"
                        :name="getLineItemName(index, 'item')"
                        :id="getLineItemName(index, 'item')"
                        autocomplete="off"
                        :placeholder="localise('itemPlaceholder')"
                        v-model="lineItem.item"
                    />
                </div>
                <div class="ff-budget__row-amount">
                    <label
                        class="ff-label"
                        :for="getLineItemName(index, 'cost')"
                        v-html="localise('amount')"
                    >
                    </label>
                    <div class="ff-currency ff-currency--row">
                        <div class="ff-currency__pre">£</div>
                        <input
                            type="number"
                            :name="getLineItemName(index, 'cost')"
                            :id="getLineItemName(index, 'cost')"
                            v-model.number="lineItem.cost"
                            :placeholder="localise('amountPlaceholder')"
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
                                :description="localise('deleteThisRow')"
                            />
                        </span>
                        {{ localise('deleteRow') }}
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
            <p v-if="error.TOO_MANY_ITEMS">
                {{ localise('tooManyItems') }} {{ maxItems }}
            </p>
            <p v-if="error.OVER_BUDGET">
                {{ localise('overBudget') }} £{{ maxBudget.toLocaleString() }}.
            </p>
        </div>

        <dl
            class="ff-budget__total"
            aria-live="polite"
            aria-atomic="true"
            data-testid="budget-total"
        >
            <dt class="ff-budget__total-label" v-html="localise('total')"></dt>
            <dd class="ff-budget__total-amount">
                £{{ total.toLocaleString() }}
            </dd>
        </dl>
    </div>
</template>
