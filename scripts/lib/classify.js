'use strict';

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const SCALAR_KEYS = ['value', 'amount', 'price', 'text', 'url', 'src', 'href'];

function unwrap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  for (const key of SCALAR_KEYS) {
    if (has(value, key)) {
      const inner = value[key];
      if (inner === null || typeof inner !== 'object') return inner;
    }
  }
  return value;
}

const NUMERIC = /-?\d+(?:[\s,]\d{3})*(?:\.\d+)?/;

function numberIn(text) {
  const match = NUMERIC.exec(text.replace(/(\d)[  ](\d)/g, '$1 $2'));
  if (!match) return NaN;
  return Number(match[0].replace(/[\s,]/g, ''));
}

function classify(raw, rule) {
  const value = unwrap(raw);

  if (value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0)) return 'dead';

  if (typeof value === 'object') return 'infected';

  const s = String(value).trim();
  if (!s || /^(null|undefined|NaN)$/i.test(s)) return 'infected';

  switch (rule.type) {
    case 'number': {
      const n = rule.words && WORDS[s.split(/\s+/).pop().toLowerCase()] !== undefined
        ? WORDS[s.split(/\s+/).pop().toLowerCase()]
        : numberIn(s);
      if (!Number.isFinite(n)) return 'infected';
      if (rule.min !== undefined && n < rule.min) return 'infected';
      if (rule.max !== undefined && n > rule.max) return 'infected';
      return 'live';
    }
    case 'url': {
      try {
        const u = new URL(s, 'https://example.invalid');
        if (!/^https?:$/.test(u.protocol)) return 'infected';
        if (!/^https?:\/\//i.test(s)) return 'infected';
        return 'live';
      } catch { return 'infected'; }
    }
    case 'string':
    default: {
      if (rule.min !== undefined && s.length < rule.min) return 'infected';
      if (rule.max !== undefined && s.length > rule.max) return 'infected';
      if (rule.pattern !== undefined && !new RegExp(rule.pattern).test(s)) return 'infected';
      return 'live';
    }
  }
}

module.exports = { WORDS, SCALAR_KEYS, unwrap, classify };
