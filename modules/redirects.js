'use strict';
const app = require('../server');
const { makeWelsh } = require('../modules/urls');

function serveRedirects({ redirects, makeBilingual = false }) {
    redirects.forEach(redirect => {
        app.get(redirect.path, (req, res) => {
            res.redirect(301, redirect.destination);
        });

        if (makeBilingual) {
            app.get(makeWelsh(redirect.path), (req, res) => {
                res.redirect(301, makeWelsh(redirect.destination));
            });
        }
    });
}

module.exports = {
    serveRedirects
};
