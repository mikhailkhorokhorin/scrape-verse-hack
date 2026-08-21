'use strict';

const store = require('./lib/store');
const classify = require('./lib/classify');
const score = require('./lib/score');
const cli = require('./lib/cli');

module.exports = { ...store, ...classify, ...score, ...cli };
