'use strict';
const express = require('express');
const path = require('path');
const config = require('config');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const helmet = require('helmet');
const nunjucks = require('nunjucks');
const cacheControl = require('express-cache-controller');
// const favicon = require('serve-favicon');
// const csrf = require('csurf');

// local deps
const assets = require('./assets');
const app = express();

// get env settings
const appEnv = process.env.NODE_ENV || 'DEV';
const IS_DEV = appEnv.toLowerCase() === 'dev';

// cache views
app.use(cacheControl({
    maxAge: (IS_DEV) ? 0 : config.get('viewCacheExpiration')
}));

// route binder
app.use('/', require('./routes/index'));
app.use('/funding', require('./routes/funding'));


// view engine setup
app.set('view engine', 'njk');



const templateEnv = nunjucks.configure('views', {
    autoescape: true,
    express: app,
    noCache: IS_DEV,
    watch: IS_DEV
});

// register template filters first
templateEnv.addFilter('getCachebustedPath', function(str) {
    return assets.getCachebustedPath(str);
});

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// const csrfProtection = csrf({ cookie: true }); // use this to protect POST data with csrfToken: req.csrfToken()
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// configure security
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

// configure static files
app.use('/' + assets.assetVirtualDir, express.static(path.join(__dirname, 'public'), {
    maxAge: config.get('staticExpiration')
}));

// extract deploy ID from AWS (where provided)
let deploymentData;
try {
    deploymentData = JSON.parse(fs.readFileSync(__dirname + '/config/deploy.json', 'utf8'));
} catch (e) {
    console.info('deploy.json not found -- are you in DEV mode?');
}
app.locals.deployId = (deploymentData && deploymentData.deployId) ? deploymentData.deployId : 'DEV';
app.locals.buildNumber = (deploymentData && deploymentData.buildNumber) ? deploymentData.buildNumber : 'DEV';

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
