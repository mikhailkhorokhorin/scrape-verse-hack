"use strict";

const HEAL_SENT_KEY = "thwip.heal.";

function healSentAt(cid) {
  try {
    return Number(sessionStorage.getItem(HEAL_SENT_KEY + cid)) || 0;
  } catch (err) {
    return 0;
  }
}

function markHealSent(cid) {
  try {
    sessionStorage.setItem(HEAL_SENT_KEY + cid, String(Date.now()));
  } catch (err) {
    return;
  }
}

function healCooldownLeft(cid) {
  const since = Date.now() - healSentAt(cid);
  return since >= HEAL_COOLDOWN_MS ? 0 : HEAL_COOLDOWN_MS - since;
}

function healButtonHTML(sp) {
  if (!HEAL_ENDPOINT) return "";
  const left = healCooldownLeft(sp.cid);
  const waiting = left > 0;
  const mins = Math.ceil(left / 60000);
  return (
    '<div class="heal">' +
      '<button class="heal__btn" type="button" data-cid="' + esc(sp.cid) + '"' +
        (waiting ? " disabled" : "") + ">Re-weave</button>" +
      '<span class="heal__note" role="status">' +
        (waiting
          ? "Handed off already — this Spider is on cooldown for another " + mins + "m."
          : "Hands this Spider to the healer. It takes up to fifteen minutes and the " +
            "watch finishes it — this button does not wait.") +
      "</span>" +
    "</div>"
  );
}

function healNote(root, text) {
  const note = root.querySelector(".heal__note");
  if (note) note.textContent = text;
}

async function sendHeal(root, cid) {
  const btn = root.querySelector(".heal__btn");
  if (!btn) return;
  btn.disabled = true;
  healNote(root, "Handing off…");

  let res;
  try {
    res = await fetch(HEAL_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ collector_id: cid }),
    });
  } catch (err) {
    btn.disabled = false;
    healNote(root, "Could not reach the healer. Nothing was started.");
    return;
  }

  if (res.status === 202) {
    markHealSent(cid);
    healNote(root, "Handed off. The re-weave runs up to fifteen minutes and the next " +
      "scan will show the result — nothing more happens on this page.");
    return;
  }
  if (res.status === 429) {
    healNote(root, "This Spider was handed off recently. The two-hour cooldown is still running.");
    return;
  }
  btn.disabled = false;
  healNote(root, "The healer refused the request. Nothing was started.");
}

function bindHeal(root) {
  const btn = root.querySelector(".heal__btn");
  if (!btn) return;
  btn.addEventListener("click", () => sendHeal(root, btn.dataset.cid));
}
