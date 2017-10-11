'use strict';

const Raven = require('raven-js');
const RavenVue = require('raven-js/plugins/vue');

function init(VueInstance) {
    Raven.config('https://53aa5923a25c43cd9a645d9207ae5b6c@sentry.io/226416', {
        ignoreErrors: ['fb_xd_fragment', /ReferenceError:.*/]
    })
        .addPlugin(RavenVue, VueInstance)
        .install();

    window.Raven = Raven;
}

module.exports = {
    init
};
