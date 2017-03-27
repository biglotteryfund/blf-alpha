'use strict';

let $postcode = document.getElementById('js-postcode');
let $form = document.getElementById('js-lookup');
let $results = document.getElementById('js-results');

$form.addEventListener('submit', (e) => {
    e.preventDefault();
    let val = $postcode.value;
    if (val) {
        lookupPostcode(val);
    }
});

let lookupPostcode = function (postcode) {
    fetch('http://api.postcodes.io/postcodes/' + encodeURIComponent(postcode), {
        method: 'get'
    }).then(r => r.json()).then(function (j) {
        getGrantsByDistrict(j.result.admin_district);
    }).catch(function (err) {
        console.error(err);
        alert("Sorry, that postcode wasn't valid :(");
    });
};

let getGrantsByDistrict = function (district) {
   fetch('./grantnav.json').then(r => r.json()).then(grants => {
       let matches = grants.grants.filter(d => {
           if (typeof d.recipientDistrictName !== 'undefined') {
               return d.recipientDistrictName.indexOf(district) !== -1;
           } else {
               return false;
           }
       });
       populateList(matches);
   }).catch(function (err) {
       console.error(err);
       alert("Error fetching grants :(");
   });
};

let populateList = function (data) {
    let HTML = '';
    data.forEach(d => {
       HTML += "<li>" + d.recipientOrganization[0].name + ' (£' + d.amountAwarded + ' awarded on ' + d.awardDate + ')</li>';
    });
    $results.innerHTML = HTML;
};