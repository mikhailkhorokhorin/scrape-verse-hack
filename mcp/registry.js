'use strict';

const read = require('./read-tools.js');
const actions = require('./action-tools.js');

const SPIDER_PROP = {
  type: 'string',
  description: 'Spider codename, for example BODEGA, ATLAS or KESTREL. Case-insensitive.'
};

const LIMIT_PROP = {
  type: 'integer',
  minimum: 1,
  maximum: read.MAX_LIMIT,
  description: `How many entries to return, newest last. Defaults to ${read.DEFAULT_LIMIT}.`
};

const SPENDS_CREDITS =
  'WARNING: this spends real Bright Data credits and takes minutes to finish. ' +
  'Only call it when the user has explicitly asked for a live run.';

const TOOLS = [
  {
    name: 'fleet_status',
    description:
      'Current health of every scraper in the THWIP fleet. For each Spider returns the latest ' +
      'run: integrity percentage, status (HEALTHY / DEGRADED / CRITICAL), which fields are ' +
      'live, infected or dead, row count and how long ago it was scanned. Reads recorded ' +
      'history only — costs nothing and returns instantly.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => read.fleetStatus()
  },
  {
    name: 'spider_history',
    description:
      'Run history for one Spider, oldest first. Each line carries the timestamp, integrity, ' +
      'status, row count and which fields were failing, so you can see when a scraper started ' +
      'to decay. Post-heal verification runs are marked. Reads recorded history only.',
    inputSchema: {
      type: 'object',
      properties: { spider: SPIDER_PROP, limit: LIMIT_PROP },
      required: ['spider'],
      additionalProperties: false
    },
    handler: (args) => read.spiderHistory(args)
  },
  {
    name: 'incident_log',
    description:
      'Breakage incidents the fleet has recorded. Each entry carries its id, the Spider, the ' +
      'strain of breakage (THROTTLED, RENAMED, DRIFTED or SHIFTED), integrity before and ' +
      'after the heal, the stages the repair passed through and whether it resolved. ' +
      'Optionally filter to one Spider. Reads recorded data only.',
    inputSchema: {
      type: 'object',
      properties: { spider: SPIDER_PROP, limit: LIMIT_PROP },
      additionalProperties: false
    },
    handler: (args) => read.incidentLog(args)
  },
  {
    name: 'heal_receipt',
    description:
      'Full timestamped receipt for one incident: every phase from DETECTED through ' +
      'DIAGNOSED, REWEAVING and VERIFIED, with the gap between phases, the total repair ' +
      'time, and the collector_id — which stays identical across the repair, proving the ' +
      'scraper was re-woven in place rather than replaced. Reads recorded data only.',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'Incident id from incident_log, for example inc_001.'
        }
      },
      required: ['incident_id'],
      additionalProperties: false
    },
    handler: (args) => read.healReceipt(args)
  },
  {
    name: 'scan_fleet',
    description:
      'Run a live scrape of every Spider (or one named Spider) through Bright Data, score the ' +
      'returned rows field by field and append the results to history. ' + SPENDS_CREDITS,
    inputSchema: {
      type: 'object',
      properties: {
        spider: {
          type: 'string',
          description: 'Scan only this Spider by codename. Omit to scan the whole fleet.'
        }
      },
      additionalProperties: false
    },
    handler: (args) => actions.scanFleet(args)
  },
  {
    name: 'heal_spider',
    description:
      'Re-weave a broken Spider through Bright Data: diagnose the strain from its last run, ' +
      'send a repair prompt, then verify with a fresh scrape and open an incident with the ' +
      'result. Refuses on a healthy Spider unless force is true. ' + SPENDS_CREDITS,
    inputSchema: {
      type: 'object',
      properties: {
        spider: SPIDER_PROP,
        force: {
          type: 'boolean',
          description: 'Heal even when the last run looks healthy. Defaults to false.'
        }
      },
      required: ['spider'],
      additionalProperties: false
    },
    handler: (args) => actions.healSpider(args)
  }
];

const BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

function schemas() {
  return TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

const has = (name) => BY_NAME.has(name);

function call(name, args) {
  const tool = BY_NAME.get(name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  return tool.handler(args || {});
}

module.exports = { TOOLS, SPENDS_CREDITS, schemas, has, call };
