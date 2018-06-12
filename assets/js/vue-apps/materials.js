import $ from 'jquery';
import Vue from 'vue';
import queryString from 'query-string';

function init() {
    const el = document.getElementById('js-materials');
    if (!el) {
        return;
    }

    let langParam = 'lang';
    // make sure we only allow valid language options
    let isValidLangParam = param => ['monolingual', 'bilingual'].indexOf(param) !== -1;

    // save the language preference in the form so we can redirect to it
    let storeLangPrefInForm = newState => $('#js-language-choice').val(newState);

    new Vue({
        el: el,
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
                        history.replaceState(null, null, `?${langParam}=${newState}`);
                    }
                }
            },
            // look up the quantity of a given item, defaulting to its
            // value when the page was loaded (eg. from session cookie)
            getQuantity: function(productId) {
                let product = this.orderData.find(o => o.productId === parseInt(productId));
                return product ? product.quantity : 0;
            },
            // work out if the user has anything in their "basket"
            // eg. should the data form be disabled or not
            isEmpty: function() {
                let quantity = 0;
                for (let o in this.orderData) {
                    quantity += this.orderData[o].quantity;
                }
                return quantity === 0;
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
                                "Sorry - you can't order this combination of items. If you need more than one of these items, please contact branding@biglotteryfund.org.uk or 020 7211 1728."
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
