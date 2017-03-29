var express = require('express');
var router = express.Router();
var rp = require('request-promise');
var grants = require('../grantnav.json');

router.get('/', function(req, res, next) {
    res.render('index', {});
});

router.get('/lookup', function(req, res, next) {

    var postcode = req.query.postcode;
    rp('http://api.postcodes.io/postcodes/' + encodeURIComponent(postcode)).then(function(data) {
        var json = JSON.parse(data);
        var yourDistrict = json.result.admin_district;
        var matches = grants.grants.filter(function (d) {
            if (typeof d.recipientDistrictName !== 'undefined') {
                return d.recipientDistrictName.indexOf(yourDistrict) !== -1;
            } else {
                return false;
            }
        });
        if (matches.length > 0) {
            console.log(matches);
            res.render('grants', {
                grants: matches
            });
        } else {
            res.redirect('/');
        }
    }).catch(function () {
        res.redirect('/');
    });

});

module.exports = router;
