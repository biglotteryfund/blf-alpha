'use strict';
const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const grants = require('../data/grantnav.json');

router.get('/', (req, res, next) => {
    res.render('index', {});
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
            res.render('grants', {
                grants: matches,
                postcode: postcode
            });
        } else {
            res.status(302).redirect('/');
        }
    }).catch(() => {
        res.status(302).redirect('/');
    });

});

module.exports = router;
