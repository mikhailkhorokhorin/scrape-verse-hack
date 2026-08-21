'use strict';

const { readdirSync } = require('fs');
const { spawnSync } = require('child_process');
const { join } = require('path');

const dir = __dirname;
const files = readdirSync(dir).filter((f) => f.endsWith('.test.js')).map((f) => join(dir, f));
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
