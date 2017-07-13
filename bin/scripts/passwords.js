#!/usr/bin/env node
// 'use strict';
const argv = require('yargs')
    .alias('p', 'password')
    .describe('p', 'Password to encrypt')
    .alias('c', 'compare')
    .describe('c', 'Hash to compare against a password')
    .help('h')
    .alias('h', 'help')
    .demandOption(['p'])
    .argv;

const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(argv.p, salt);

if (argv.c) {
    console.log(bcrypt.compareSync(argv.p, argv.c));
} else {
    console.log(hash);
}

