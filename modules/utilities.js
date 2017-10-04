"use strict";

let stripTrailingSlashes = (str) => {
    let hasTrailingSlash = (s) => s[s.length - 1] === '/' && s.length > 1;

    if (hasTrailingSlash(str)) {
        // trim final character
        str = str.substring(0, str.length - 1);
    }

    return str;
};

module.exports = {
    stripTrailingSlashes
};
