const fs = require('fs');
const path = require('path');
const { products, variants } = require('./build-data.js');
const { buildPage } = require('./build-page.js');

for (const key of Object.keys(variants)) {
  const out = path.join(__dirname, variants[key].file);
  fs.writeFileSync(out, buildPage(variants, key, products), 'utf8');
  process.stdout.write(`${variants[key].file}\n`);
}
