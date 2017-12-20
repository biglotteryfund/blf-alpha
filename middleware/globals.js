'use strict';

const config = require('config');

module.exports = function(app) {
    const setViewGlobal = (k, v) => app.get('engineEnv').addGlobal(k, v);

    return function (req, res, next) {
        // add the request object as a local variable
        // for URL rewriting in templates
        // (eg. locale versions, high-contrast redirect etc)
        res.locals.request = req;

        if (req.flash('showOverlay')) {
            setViewGlobal('showOverlay', true);
        } else {
            setViewGlobal('showOverlay', false);
        }

        // get a11y contrast preferences
        let contrastPref = req.cookies[config.get('cookies.contrast')];
        if (contrastPref && contrastPref === 'high') {
            setViewGlobal('highContrast', true);
        } else {
            setViewGlobal('highContrast', false);
        }

        next();
    };
};
