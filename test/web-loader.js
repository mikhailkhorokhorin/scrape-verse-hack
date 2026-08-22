'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WEB_DIR = path.join(__dirname, '..', 'web', 'js');
const DATA_DIR = path.join(__dirname, '..', 'data');

const BASE_GLOBALS = {
  Array,
  Boolean,
  Date,
  Error,
  JSON,
  Map,
  Math,
  Number,
  Object,
  Promise,
  RegExp,
  Set,
  String,
  Symbol,
  TextDecoder: global.TextDecoder,
  TypeError,
  URL,
  Uint8Array,
  console,
  isFinite,
  isNaN,
  parseFloat,
  parseInt,
};

const LEXICAL = /^(?:const|let)\s+([A-Z_a-z$][\w$]*)/gm;

function lexicalNames(source) {
  const names = [];
  let match = LEXICAL.exec(source);
  while (match !== null) {
    names.push(match[1]);
    match = LEXICAL.exec(source);
  }
  LEXICAL.lastIndex = 0;
  return names;
}

function exposeLexicals(source) {
  const names = lexicalNames(source);
  if (names.length === 0) return '';
  return '\n' + names.map((n) => 'globalThis.' + n + ' = ' + n + ';').join('\n');
}

function findModule(dir, wanted) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const deeper = findModule(full, wanted);
      if (deeper) return deeper;
    } else if (entry.name === wanted) {
      return full;
    }
  }
  return null;
}

function modulePath(name) {
  const wanted = name.endsWith('.js') ? name : name + '.js';
  const direct = path.join(WEB_DIR, wanted);
  if (fs.existsSync(direct)) return direct;
  const found = findModule(WEB_DIR, path.basename(wanted));
  if (!found) throw new Error('no web module named ' + wanted);
  return found;
}

function loadWebModule(names, extra) {
  const context = vm.createContext(Object.assign({}, BASE_GLOBALS, extra || {}));
  for (const name of names) {
    const file = modulePath(name);
    const source = fs.readFileSync(file, 'utf8');
    vm.runInContext(source + exposeLexicals(source), context, { filename: name });
  }
  return context;
}

function setGlobal(context, name, value) {
  context.__incoming = value;
  vm.runInContext(name + ' = __incoming;', context);
  delete context.__incoming;
}

function plain(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
}

module.exports = { loadWebModule, readFixture, setGlobal, plain, WEB_DIR, DATA_DIR };
