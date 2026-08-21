const COOLDOWN_MS = 2 * 60 * 60 * 1000;
const recent = new Map();

function corsHeaders(env) {
  return {
    "access-control-allow-origin": env.ORIGIN,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function reply(status, env, body) {
  return new Response(body || null, { status: status, headers: corsHeaders(env) });
}

function allowed(env) {
  return String(env.ALLOWED || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function readCollectorId(req) {
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return null;
  }
  const id = payload && payload.collector_id;
  return typeof id === "string" && /^c_[a-z0-9]{1,64}$/i.test(id) ? id : null;
}

function onCooldown(id, now) {
  const last = recent.get(id) || 0;
  return now - last < COOLDOWN_MS;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin");
    if (origin && origin !== env.ORIGIN) return reply(403, env);

    if (req.method === "OPTIONS") return reply(204, env);
    if (req.method !== "POST") return reply(405, env);

    const collectorId = await readCollectorId(req);
    if (!collectorId) return reply(400, env);
    if (!allowed(env).includes(collectorId)) return reply(403, env);

    const now = Date.now();
    if (onCooldown(collectorId, now)) return reply(429, env);

    const body = new URLSearchParams({
      token: env.TRIGGER_TOKEN,
      ref: "main",
      "variables[HEAL_COLLECTOR]": collectorId,
    });

    let upstream;
    try {
      upstream = await fetch(
        "https://gitlab.com/api/v4/projects/" + env.PROJECT_ID + "/trigger/pipeline",
        { method: "POST", body: body }
      );
    } catch (err) {
      return reply(502, env);
    }

    if (!upstream.ok) return reply(502, env);

    recent.set(collectorId, now);
    return reply(202, env);
  },
};
