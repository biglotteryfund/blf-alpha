'use strict';
const express = require('express');
const router = express.Router();
const config = require('config');
const rp = require('request-promise');
const grants = require('../bin/data/grantnav.json');
const logger = require('../logger');

router.get('/', (req, res, next) => {
    res.render('pages/index', {});
});

router.get('/contrast/:mode', (req, res, next) => {
    let duration = 6 * 30 * 24 * 60 * 60; // 6 months
    let cookieName = config.get('contrastCookie.name');
    let redirectUrl = req.query.url || '/';
    if (req.params.mode === 'high') {
        res.cookie(cookieName, req.params.mode, {
            maxAge: duration,
            httpOnly: false
        });
    } else {
        res.clearCookie(cookieName);
    }
    res.redirect(redirectUrl);
});

router.get('/lookup', (req, res, next) => {

    let postcode = req.query.postcode;
    rp('http://api.postcodes.io/postcodes/' + encodeURIComponent(postcode)).then((data) => {
        let json = JSON.parse(data);
        let yourDistrict = json.result.admin_district;
        let matches = grants.grants.filter(d => {
            if (typeof d.recipientDistrictName !== 'undefined') {
                return d.recipientDistrictName.indexOf(yourDistrict) !== -1;
            } else {
                return false;
            }
        });
        if (matches.length > 0) {
            res.render('pages/grants', {
                grants: matches,
                postcode: postcode
            });
        } else {
            logger.log('info', 'GET /lookup found a valid postcode but no matching grants', {
                postcode: postcode,
                district: yourDistrict
            });
            res.status(302).redirect('/');
        }
    }).catch(() => {
        logger.log('info', 'GET /lookup received an invalid postcode', {
            postcode: postcode
        });
        res.status(302).redirect('/');
    });

});

module.exports = router;
