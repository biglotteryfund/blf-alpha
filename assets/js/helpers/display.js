const $ = require('jquery');
const $html = $('html');

function toggleNav() {
    $html.toggleClass('show-off-canvas');
}

module.exports = {
    toggleNav
};
