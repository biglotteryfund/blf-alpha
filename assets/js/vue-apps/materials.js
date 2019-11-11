import $ from 'jquery';
import find from 'lodash/find';
import sumBy from 'lodash/sumBy';
import Vue from 'vue';
import queryString from 'query-string';

function init() {
    // Handle making "other" inputs required for radio sets
    // We bind to the body element like this because these
    // fields are rendered by Vue and not always in the DOM
    $('body').on('click', `.js-has-radios input[type="radio"]`, function() {
        const $clickedRadio = $(this);
        // find the corresponding <input> field for this radio set
        const $other = $(
            '#' + $clickedRadio.parents(`.js-has-radios`).data('other-id')
        );
        if ($other.length === 0) {
            return;
        }

        // is the clicked element an "other" trigger?
        if ($clickedRadio.hasClass('js-other-trigger')) {
            $other.attr('required', true);
        } else {
            // they clicked on one of the regular radio options
            $other.attr('required', false);
        }
    });

    const mountEl = document.getElementById('js-vue');
    if (!mountEl) {
        return;
    }

    let langParam = 'lang';
    // make sure we only allow valid language options
    let isValidLangParam = param =>
        ['monolingual', 'bilingual'].indexOf(param) !== -1;

    // save the language preference in the form so we can redirect to it
    let storeLangPrefInForm = newState =>
        $('#js-language-choice').val(newState);

    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data: {
            orderData: [],
            itemLanguage: null
        },
        created: function() {
            // check for a ?lang param and show the relevant products (if valid)
            let params = queryString.parse(location.search);
            if (params[langParam] && isValidLangParam(params[langParam])) {
                storeLangPrefInForm(params[langParam]);
                this.itemLanguage = params[langParam];
            }
        },
        mounted: function() {
            this.$el.classList.remove('no-vue');
            let sessionOrders = this.$el.getAttribute('data-orders');
            if (sessionOrders) {
                this.orderData = JSON.parse(sessionOrders);
            }
        },
        methods: {
            // swap between languages for product list
            toggleItemLanguage: function(newState) {
                if (isValidLangParam(newState)) {
                    this.itemLanguage = newState;
                    storeLangPrefInForm(newState);
                    // add this to the URL
                    if (history.replaceState) {
                        history.replaceState(
                            null,
                            null,
                            `?${langParam}=${newState}`
                        );
                    }
                }
            },
            // look up the quantity of a given item, defaulting to its
            // value when the page was loaded (eg. from session cookie)
            getQuantity: function(productId) {
                let product = find(
                    this.orderData,
                    o => o.productId === parseInt(productId)
                );
                return product ? product.quantity : 0;
            },
            // work out if the user has anything in their "basket"
            // eg. should the data form be disabled or not
            isEmpty: function() {
                return sumBy(this.orderData, item => item.quantity) === 0;
            },
            // increment/decrement a product in the user's basket via AJAX
            changeQuantity: function(e) {
                let $elm = $(e.currentTarget);
                const $form = $elm.parents('form');
                const url = $form.attr('action');
                let data = $form.serialize();
                // is this an increase or decrease button?
                data += '&action=' + $elm.val();
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    success: response => {
                        if (response.itemBlocked) {
                            alert(
                                "Sorry - you can't order this combination of items. If you need more than one of these items, please contact branding@tnlcommunityfund.org.uk or 020 7211 1728."
                            );
                        }
                        this.orderData = response.orders;
                    }
                });
            }
        }
    });
}

export default {
    init
};
