'use strict';
const express = require('express');
const app = express();

// configure boilerplate
require('./boilerplate/globals')(app);
require('./boilerplate/security')(app);
require('./boilerplate/viewEngine')(app);
require('./boilerplate/static')(app);
require('./boilerplate/cache')(app);
require('./boilerplate/middleware')(app);

// route binder
app.use('/', require('./routes/index'));
app.use('/status', require('./routes/status'));
app.use('/funding', require('./routes/funding'));

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
