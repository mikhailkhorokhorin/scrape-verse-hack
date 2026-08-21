"use strict";

const MONEY_KEYS = ["value", "amount", "price"];
const SCALAR_KEYS = ["value", "amount", "price", "text", "url", "src", "href"];

function isPlainObject(raw) {
  return raw !== null && typeof raw === "object" && !Array.isArray(raw);
}

function moneyOf(raw) {
  const key = MONEY_KEYS.find((k) => typeof raw[k] === "number");
  if (!key) return null;
  const symbol = typeof raw.symbol === "string" ? raw.symbol : "";
  const currency = typeof raw.currency === "string" ? raw.currency : "";
  const amount = String(raw[key]);
  if (symbol) return symbol + amount + (currency ? " " + currency : "");
  return currency ? amount + " " + currency : amount;
}

function unwrapScalar(raw) {
  for (const key of SCALAR_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const inner = raw[key];
    if (inner === null || typeof inner !== "object") return inner;
  }
  return undefined;
}

function valueText(raw) {
  if (raw === null) return "null";
  if (raw === undefined) return "missing";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  if (Array.isArray(raw)) return raw.length === 0 ? "[]" : "[" + raw.map(valueText).join(", ") + "]";
  if (isPlainObject(raw)) {
    const money = moneyOf(raw);
    if (money !== null) return money;
    const scalar = unwrapScalar(raw);
    if (scalar !== undefined) return valueText(scalar);
    const parts = Object.keys(raw).map((k) => k + ": " + valueText(raw[k]));
    return "{ " + parts.join(", ") + " }";
  }
  return String(raw);
}

function isQuoted(raw) {
  return typeof raw === "string";
}

function valueLiteral(raw) {
  if (raw === null || raw === undefined) return "null";
  const text = valueText(raw);
  return isQuoted(raw) ? '"' + text + '"' : text;
}

function shapeOf(raw) {
  if (Array.isArray(raw)) return "array";
  if (isPlainObject(raw)) return "object";
  return typeof raw;
}
