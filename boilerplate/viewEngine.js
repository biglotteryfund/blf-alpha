'use strict';
const nunjucks = require('nunjucks');
const assets = require('../assets');

module.exports = function (app) {

    // view engine setup
    app.set('view engine', 'njk');

    const templateEnv = nunjucks.configure('views', {
        autoescape: true,
        express: app,
        noCache: app.locals.IS_DEV,
        watch: app.locals.IS_DEV
    });

    // register template filters first
    templateEnv.addFilter('getCachebustedPath', function (str) {
        return assets.getCachebustedPath(str);
    });

    // via http://stackoverflow.com/a/25770787
    templateEnv.addFilter('splitByCharLength', function (str, length) {
        let rows = [];
        let maxlen = length || 50;
        let arr = str.split(" ");
        let currow = arr[0];
        let rowlen = currow.length;
        for (let i = 1; i < arr.length; i++) {
            let word = arr[i];
            rowlen += word.length + 1;
            if (rowlen <= maxlen) {
                currow += " " + word;
            } else {
                rows.push(currow);
                currow = word;
                rowlen = word.length;
            }
        }
        rows.push(currow);
        return rows;
    });

    return templateEnv;

};