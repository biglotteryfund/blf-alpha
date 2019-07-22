'use strict';
const fs = require('fs');
const path = require('path');

/**
 * List of the most commonly used passwords. Specifically to 10k, filtered by min-length
 * awk 'length($0)>9' full-list.txt > common-passwords.txt
 * @see https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials
 */
const commonPasswords = fs
    .readFileSync(path.resolve(__dirname, './common-passwords.txt'), 'utf8')
    .toString()
    .split('\n');

module.exports = commonPasswords;
