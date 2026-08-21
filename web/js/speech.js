"use strict";

const SPEECH_MS = 2600;

function speechDeadLine(fields) {
  const dead = fields.filter((f) => f.from !== "dead" && f.to === "dead");
  if (!dead.length) return null;
  const names = dead.map((f) => f.name);
  const subject = names.length === 1
    ? names[0] + " is"
    : names.slice(0, -1).join(", ") + " and " + names[names.length - 1] + " are";
  return { kind: "dead", voice: "character", text: subject + " gone." };
}

function speechHealLine(change) {
  if (!change.afterHeal) return null;
  return { kind: "heal", voice: "character", text: "I'm back." };
}

function speechStreakLine(change, spider) {
  if (!change.newRun) return null;
  if (!spider || !(spider.streak >= MIN_STREAK)) return null;
  if (change.fields.some((f) => f.to !== "live")) return null;
  return { kind: "streak", voice: "character", text: "...still here." };
}

function speechInfectedLine(fields) {
  const bad = fields.filter((f) => f.from !== "infected" && f.to === "infected");
  if (!bad.length) return null;
  return { kind: "infected", voice: "symbiote", text: bad[0].name + " came back wrong." };
}

function speechLineFor(change, spider) {
  if (!change) return null;
  const fields = change.fields || [];
  return (
    speechDeadLine(fields) ||
    speechInfectedLine(fields) ||
    speechHealLine(change) ||
    speechStreakLine(change, spider)
  );
}

const SPEECH_RANK = { dead: 0, infected: 1, heal: 2, streak: 3 };

function speechCandidatesOf(delta, spiders) {
  const list = (delta && delta.changes ? delta.changes : []);
  const byCode = {};
  for (const sp of spiders || []) if (sp && sp.code) byCode[sp.code] = sp;
  return list
    .map((change) => {
      const line = speechLineFor(change, byCode[change.code]);
      return line ? Object.assign({ code: change.code }, line) : null;
    })
    .filter(Boolean);
}

function speechPickOf(delta, spiders) {
  const candidates = speechCandidatesOf(delta, spiders);
  if (!candidates.length) return null;
  let best = candidates[0];
  for (const candidate of candidates) {
    if (SPEECH_RANK[candidate.kind] < SPEECH_RANK[best.kind]) best = candidate;
  }
  return best;
}
