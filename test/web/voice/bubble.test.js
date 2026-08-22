'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadWebModule, setGlobal } = require('../../web-loader.js');

function fakeNode(className) {
  const node = {
    className: className || '',
    children: [],
    attributes: {},
    textContent: '',
    parent: null,
    classList: {
      contains: (name) => node.className.split(' ').includes(name),
      add: (name) => {
        if (!node.classList.contains(name)) node.className = (node.className + ' ' + name).trim();
      },
      remove: (name) => {
        node.className = node.className.split(' ').filter((c) => c && c !== name).join(' ');
      },
    },
    setAttribute: (key, value) => { node.attributes[key] = value; },
    appendChild: (child) => { child.parent = node; node.children.push(child); },
    remove: () => {
      if (!node.parent) return;
      node.parent.children = node.parent.children.filter((c) => c !== node);
      node.parent = null;
    },
    closest: (selector) => (selector === '.cell' ? node.cell || null : null),
  };
  return node;
}

function harness() {
  const root = fakeNode('');
  const timers = [];
  const panels = {};

  function makePanel(code) {
    const cell = fakeNode('cell');
    const panel = fakeNode('panel');
    panel.cell = cell;
    panels[code] = panel;
    return panel;
  }

  makePanel('BODEGA');
  makePanel('ATLAS');

  const context = loadWebModule(['config.js', 'delta.js', 'speech.js', 'bubble.js'], {
    document: {
      documentElement: root,
      createElement: () => fakeNode(''),
    },
    setTimeout: (fn, ms) => {
      timers.push({ fn: fn, ms: ms });
      return timers.length;
    },
    clearTimeout: (id) => {
      if (timers[id - 1]) timers[id - 1].cancelled = true;
    },
  });

  setGlobal(context, 'panelOf', null);
  context.__panels = panels;
  const vm = require('node:vm');
  vm.runInContext('panelOf = function(code){ return __panels[code] || null; };', context);

  return { context: context, root: root, timers: timers, panels: panels };
}

function change(overrides) {
  return Object.assign({
    code: 'BODEGA',
    newRun: true,
    afterHeal: false,
    integrityFrom: 100,
    integrityTo: 100,
    fields: [],
  }, overrides || {});
}

function spider(overrides) {
  return Object.assign({
    code: 'BODEGA',
    ts: '2026-08-21T12:00:00Z',
    integrity: 100,
    streak: 0,
    fieldOrder: ['title', 'price'],
    fields: { title: 'live', price: 'live' },
  }, overrides || {});
}

const DEAD_PRICE = { fields: [{ name: 'price', from: 'live', to: 'dead' }] };

function bubblesIn(h) {
  return Object.keys(h.panels)
    .map((code) => h.panels[code].cell.children)
    .reduce((all, kids) => all.concat(kids), [])
    .filter((node) => node.className.split(' ').includes('bubble'));
}

test('a speakable transition mounts one bubble on the right panel', () => {
  const h = harness();
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  const mounted = bubblesIn(h);
  assert.equal(mounted.length, 1);
  assert.equal(mounted[0].textContent, 'price is gone.');
  assert.equal(h.panels.BODEGA.cell.children.length, 1);
});

test('the bubble carries the voice of the line that fired', () => {
  const h = harness();
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  assert.ok(bubblesIn(h)[0].className.includes('bubble--character'));
});

test('a symbiote line mounts in the symbiote voice class', () => {
  const h = harness();
  h.context.speak({
    changes: [change({ fields: [{ name: 'title', from: 'live', to: 'infected' }] })],
  }, [spider()]);
  const mounted = bubblesIn(h);
  assert.ok(mounted[0].className.includes('bubble--symbiote'));
  assert.equal(mounted[0].textContent, 'title came back wrong.');
});

test('only one bubble is on screen when two collectors both speak', () => {
  const h = harness();
  h.context.speak({
    changes: [
      change({ code: 'ATLAS', afterHeal: true }),
      change(DEAD_PRICE),
    ],
  }, [spider(), spider({ code: 'ATLAS' })]);
  assert.equal(bubblesIn(h).length, 1);
});

test('a second transition replaces the first bubble rather than adding one', () => {
  const h = harness();
  h.context.speak({ changes: [change({ code: 'ATLAS', afterHeal: true })] }, [spider({ code: 'ATLAS' })]);
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  const mounted = bubblesIn(h);
  assert.equal(mounted.length, 1);
  assert.equal(mounted[0].textContent, 'price is gone.');
  assert.equal(h.panels.ATLAS.cell.children.length, 0);
});

test('replacing a bubble cancels the outgoing bubble timer', () => {
  const h = harness();
  h.context.speak({ changes: [change({ code: 'ATLAS', afterHeal: true })] }, [spider({ code: 'ATLAS' })]);
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  assert.equal(h.timers[0].cancelled, true);
  assert.equal(h.timers[h.timers.length - 1].cancelled, undefined);
});

test('the dismiss timer is scheduled under three seconds', () => {
  const h = harness();
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  assert.ok(h.timers[0].ms < 3000);
});

test('the dismiss timer removes the bubble and its cell marker', () => {
  const h = harness();
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  assert.ok(h.panels.BODEGA.cell.classList.contains('has-bubble'));
  h.timers[0].fn();
  assert.equal(bubblesIn(h).length, 0);
  assert.equal(h.panels.BODEGA.cell.classList.contains('has-bubble'), false);
});

test('no bubble appears while the intro sequence is running', () => {
  const h = harness();
  h.root.classList.add('intro-running');
  const pick = h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  assert.equal(pick, null);
  assert.equal(bubblesIn(h).length, 0);
});

test('bubbles resume once the intro sequence finishes', () => {
  const h = harness();
  h.root.classList.add('intro-running');
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  h.root.classList.remove('intro-running');
  h.context.speak({ changes: [change(DEAD_PRICE)] }, [spider()]);
  assert.equal(bubblesIn(h).length, 1);
});

test('an idle poll with no transition leaves no bubble', () => {
  const h = harness();
  assert.equal(h.context.speak({ changes: [] }, [spider()]), null);
  assert.equal(bubblesIn(h).length, 0);
});

test('a transition on a collector with no rendered panel mounts nothing', () => {
  const h = harness();
  const pick = h.context.speak({
    changes: [change({ code: 'KESTREL', fields: DEAD_PRICE.fields })],
  }, [spider({ code: 'KESTREL' })]);
  assert.equal(pick, null);
  assert.equal(bubblesIn(h).length, 0);
});
