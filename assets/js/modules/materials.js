/* global Vue */
'use strict';

const $ = require('jquery');
const queryString = require('query-string');

function init() {
    const mountEl = document.getElementById('js-vue');
    if (!mountEl) {
        return;
    }

    let allOrderData = {};
    let langParam = 'lang';
    // make sure we only allow valid language options
    let isValidLangParam = param => ['monolingual', 'bilingual'].indexOf(param) !== -1;

    // save the language preference in the form so we can redirect to it
    let storeLangPrefInForm = newState => $('#js-language-choice').val(newState);

    new Vue({
        el: mountEl,
        data: {
            orderData: allOrderData,
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
            getQuantity: function(code, valueAtPageload) {
                if (this.orderData[code]) {
                    return this.orderData[code].quantity;
                } else {
                    return valueAtPageload;
                }
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
                        // update the basket data from the session
                        allOrderData = response.allOrders;
                        // this triggers a Vue update (and needs a babel plugin to work in IE)
                        this.orderData = Object.assign({}, this.orderData, response.allOrders);
                    }
                });
            }
        }
    });
}

module.exports = {
    init
};
