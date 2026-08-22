'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const { modulePath } = require('../../web-loader.js');

const NAMES = [
  'webRound', 'webRand', 'webPick', 'webPickInt', 'webSeedRng', 'webPoint',
  'webSpokeAngles', 'webSpoke', 'webRing', 'webRingRadii', 'webPlan', 'webTaper',
  'webInBox', 'webQuadAt', 'webClearOf', 'webKeepOut', 'webCross',
];

function makeGeom() {
  const source = fs.readFileSync(modulePath('web-geom.js'), 'utf8');
  const context = vm.createContext({ Math, Object, Array, Number, String, JSON });
  const expose = NAMES.map((n) => 'globalThis.' + n + ' = ' + n + ';').join('\n');
  vm.runInContext(source + '\n' + expose, context, { filename: 'web-geom.js' });
  return context;
}

module.exports = { makeGeom };
