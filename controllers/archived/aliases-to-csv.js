#!/usr/bin/env node
'use strict';
const aliases = require('./aliases');

let output = `From,To\n`;

aliases.forEach((a) => {
    output += `${a.from},${a.to}\n`;
});

console.log(output);
