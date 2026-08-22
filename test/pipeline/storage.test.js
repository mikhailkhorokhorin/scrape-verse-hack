'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readJSON, writeJSON, nextIncidentId } = require('../../scripts/lib.js');

const sandbox = () => fs.mkdtempSync(path.join(os.tmpdir(), 'thwip-test-'));

const withSandbox = (fn) => {
  const dir = sandbox();
  try { fn(path.join(dir, 'store.json')); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
};

test('readJSON returns the fallback when the file does not exist', () => {
  withSandbox((file) => {
    assert.deepEqual(readJSON(file, { collectors: [] }), { collectors: [] });
  });
});

test('readJSON returns the parsed contents of a valid file', () => {
  withSandbox((file) => {
    fs.writeFileSync(file, '{"a":1}');
    assert.deepEqual(readJSON(file, null), { a: 1 });
  });
});

test('readJSON throws instead of silently returning the fallback on corrupt JSON', () => {
  withSandbox((file) => {
    fs.writeFileSync(file, '{"a":1,,,}');
    assert.throws(() => readJSON(file, []), /not valid JSON/);
  });
});

test('readJSON names the offending path when it refuses corrupt JSON', () => {
  withSandbox((file) => {
    fs.writeFileSync(file, 'garbage');
    assert.throws(() => readJSON(file, []), new RegExp('refusing to overwrite'));
  });
});

test('readJSON throws on an empty file rather than treating it as absent', () => {
  withSandbox((file) => {
    fs.writeFileSync(file, '');
    assert.throws(() => readJSON(file, []), /not valid JSON/);
  });
});

test('writeJSON creates a file that reads back as the same data', () => {
  withSandbox((file) => {
    writeJSON(file, { a: [1, 2], b: 'x' });
    assert.deepEqual(readJSON(file, null), { a: [1, 2], b: 'x' });
  });
});

test('writeJSON replaces existing contents rather than appending', () => {
  withSandbox((file) => {
    writeJSON(file, { first: true });
    writeJSON(file, { second: true });
    assert.deepEqual(readJSON(file, null), { second: true });
  });
});

test('writeJSON leaves no temporary file behind after a successful write', () => {
  withSandbox((file) => {
    writeJSON(file, { a: 1 });
    const strays = fs.readdirSync(path.dirname(file)).filter((n) => n.includes('.tmp'));
    assert.deepEqual(strays, []);
  });
});

test('writeJSON keeps the previous contents intact when serialisation fails', () => {
  withSandbox((file) => {
    writeJSON(file, { keep: 'me' });
    const circular = {};
    circular.self = circular;
    assert.throws(() => writeJSON(file, circular));
    assert.deepEqual(readJSON(file, null), { keep: 'me' });
  });
});

test('writeJSON terminates the file with a trailing newline', () => {
  withSandbox((file) => {
    writeJSON(file, { a: 1 });
    assert.ok(fs.readFileSync(file, 'utf8').endsWith('\n'));
  });
});

test('writeJSON round-trips an empty array without loss', () => {
  withSandbox((file) => {
    writeJSON(file, []);
    assert.deepEqual(readJSON(file, null), []);
  });
});

test('nextIncidentId starts numbering at one for an empty ledger', () => {
  assert.equal(nextIncidentId([]), 'inc_001');
});

test('nextIncidentId zero-pads the sequence to three digits', () => {
  assert.match(nextIncidentId([]), /^inc_\d{3}$/);
});

test('nextIncidentId issues three distinct ids when appended in sequence', () => {
  const ledger = [];
  const issued = [];
  for (let i = 0; i < 3; i++) {
    const id = nextIncidentId(ledger);
    issued.push(id);
    ledger.push({ id });
  }
  assert.equal(new Set(issued).size, 3);
});

test('nextIncidentId issues consecutive ids when appended in sequence', () => {
  const ledger = [];
  const issued = [];
  for (let i = 0; i < 3; i++) {
    const id = nextIncidentId(ledger);
    issued.push(id);
    ledger.push({ id });
  }
  assert.deepEqual(issued, ['inc_001', 'inc_002', 'inc_003']);
});

test('nextIncidentId avoids colliding with a gap in the existing numbering', () => {
  const id = nextIncidentId([{ id: 'inc_001' }, { id: 'inc_005' }]);
  assert.ok(!['inc_001', 'inc_005'].includes(id));
});

test('nextIncidentId survives null entries in the ledger', () => {
  assert.match(nextIncidentId([null, { id: 'inc_001' }]), /^inc_\d{3}$/);
});

test('nextIncidentId survives entries with no id field', () => {
  assert.match(nextIncidentId([{ spider: 'X' }, { id: 'inc_001' }]), /^inc_\d{3}$/);
});

test('nextIncidentId skips past a taken id at the natural next slot', () => {
  assert.equal(nextIncidentId([{ id: 'inc_003' }, { id: 'inc_001' }]), 'inc_004');
});

test('nextIncidentId keeps numbering above three digits once the ledger is large', () => {
  const ledger = Array.from({ length: 1000 }, (_, i) => ({
    id: `inc_${String(i + 1).padStart(3, '0')}`
  }));
  assert.equal(nextIncidentId(ledger), 'inc_1001');
});
