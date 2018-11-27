'use strict';
const config = require('config');
const { includes } = require('lodash');

const appData = require('../modules/appData');

/**
 * Allows feature flags to be passed through as query strings
 * e.g. ?enable-feature=use-new-header
 * Useful for testing new features
 */
function queryFeature(req, res, name) {
    const featureNames = ['use-new-header', 'preview-digital-fund'];
    const enableFeatures = req.query['enable-feature'] ? req.query['enable-feature'].split(',') : [];
    const disableFeatures = req.query['disable-feature'] ? req.query['disable-feature'].split(',') : [];

    const cookieName = config.get('cookies.features');
    const featuresCookie = req.cookies[cookieName];
    const featuresCookieList = featuresCookie ? featuresCookie.split(',') : [];
    const isInCookieList = includes(featuresCookieList, name) && includes(featureNames, name);
    const enableWithQuery = includes(featureNames, name) && includes(enableFeatures, name);
    const disableWithQuery = includes(featureNames, name) && includes(disableFeatures, name);

    const setFeatureCookie = features => {
        if (features.length > 0) {
            res.cookie(cookieName, features.join(','), {
                httpOnly: true,
                secure: !appData.isDev
            });
        } else {
            res.clearCookie(cookieName);
        }
    };

    if (disableWithQuery) {
        const newFeaturesCookieList = featuresCookieList.filter(val => val !== name);
        setFeatureCookie(newFeaturesCookieList);
        return false;
    } else if (isInCookieList) {
        return true;
    } else if (enableWithQuery) {
        featuresCookieList.push(name);
        setFeatureCookie(featuresCookieList);
        return true;
    } else {
        return false;
    }
}

module.exports = {
    queryFeature
};
