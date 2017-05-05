'use strict';
const helmet = require('helmet');
// const csrf = require('csurf');
// const csrfProtection = csrf({ cookie: true }); // use this to protect POST data with csrfToken: req.csrfToken()

module.exports = function (app) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'fonts.gstatic.com', 'code.ionicframework.com'],
                styleSrc: ["'self'", 'code.ionicframework.com', 'fonts.googleapis.com'],
                connectSrc: ['ws://127.0.0.1:35729/livereload'] // make dev-only?
            }
        },
        dnsPrefetchControl: {
            allow: true
        },
        frameguard: {
            action: 'sameorigin'
        },
    }));
};