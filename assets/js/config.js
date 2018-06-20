// https://medium.com/@aviv.rosental/portable-bundle-with-webpack-d2eed216cd4c
var script = document.getElementById('js-script-main');
var src = script.getAttribute('src');
__webpack_public_path__ = src.substr(0, src.lastIndexOf('/') + 1); // eslint-disable-line
