'use strict';

const { readdirSync } = require('fs');
const { spawnSync } = require('child_process');
const { join } = require('path');

function testFilesIn(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...testFilesIn(full));
    else if (entry.name.endsWith('.test.js')) found.push(full);
  }
  return found;
}

const files = testFilesIn(__dirname);
const passthrough = process.argv.slice(2);
const result = spawnSync(process.execPath, ['--test', ...passthrough, ...files], { stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
