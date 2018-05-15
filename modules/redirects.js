'use strict';
const { forEach } = require('lodash');
const app = require('../server');
const { makeWelsh } = require('../modules/urls');

function serveRedirects({ redirects, makeBilingual = false }) {
    forEach(redirects, (to, from) => {
        app.get(from, (req, res) => {
            res.redirect(301, to);
        });

        if (makeBilingual) {
            app.get(makeWelsh(from), (req, res) => {
                res.redirect(301, makeWelsh(to));
            });
        }
    });
}

module.exports = {
    serveRedirects
};
