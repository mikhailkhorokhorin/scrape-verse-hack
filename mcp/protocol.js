'use strict';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'thwip', version: '1.0.0' };

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

function result(id, payload) {
  return { jsonrpc: '2.0', id, result: payload };
}

function failure(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id: id === undefined ? null : id, error };
}

function validate(message) {
  if (!isObject(message)) return 'request must be a JSON object';
  if (message.jsonrpc !== '2.0') return 'jsonrpc must be "2.0"';
  if (typeof message.method !== 'string' || !message.method) {
    return 'method must be a non-empty string';
  }
  if (message.params !== undefined && !isObject(message.params) &&
      !Array.isArray(message.params)) {
    return 'params must be an object or array';
  }
  const { id } = message;
  if (id !== undefined && id !== null && typeof id !== 'string' && typeof id !== 'number') {
    return 'id must be a string, number or null';
  }
  return null;
}

const isNotification = (message) => isObject(message) && message.id === undefined;

function textContent(text) {
  return { content: [{ type: 'text', text }] };
}

function toolError(text) {
  return { content: [{ type: 'text', text }], isError: true };
}

function initializeResult() {
  return {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: { tools: { listChanged: false } },
    serverInfo: SERVER_INFO
  };
}

function dispatch(message, registry) {
  const invalid = validate(message);
  if (invalid) return failure(message && message.id, INVALID_REQUEST, invalid);

  const { method, id, params } = message;

  if (method === 'initialize') return result(id, initializeResult());
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, { tools: registry.schemas() });

  if (method === 'tools/call') {
    if (!isObject(params)) {
      return failure(id, INVALID_PARAMS, 'params must be an object');
    }
    if (typeof params.name !== 'string' || !params.name) {
      return failure(id, INVALID_PARAMS, 'params.name must be a non-empty string');
    }
    if (params.arguments !== undefined && !isObject(params.arguments)) {
      return failure(id, INVALID_PARAMS, 'params.arguments must be an object');
    }
    if (!registry.has(params.name)) {
      return failure(id, INVALID_PARAMS, `unknown tool: ${params.name}`);
    }
    try {
      return result(id, registry.call(params.name, params.arguments || {}));
    } catch (err) {
      return result(id, toolError(err.message));
    }
  }

  if (method.startsWith('notifications/')) return null;

  return failure(id, METHOD_NOT_FOUND, `unknown method: ${method}`);
}

function handleLine(line, registry) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let message;
  try {
    message = JSON.parse(trimmed);
  } catch (err) {
    return failure(null, PARSE_ERROR, `invalid JSON: ${err.message}`);
  }

  if (Array.isArray(message)) {
    return failure(null, INVALID_REQUEST, 'batch requests are not supported');
  }

  if (isNotification(message) && validate(message) === null) {
    dispatch(message, registry);
    return null;
  }

  try {
    return dispatch(message, registry);
  } catch (err) {
    return failure(message && message.id, INTERNAL_ERROR, err.message);
  }
}

module.exports = {
  PROTOCOL_VERSION, SERVER_INFO,
  PARSE_ERROR, INVALID_REQUEST, METHOD_NOT_FOUND, INVALID_PARAMS, INTERNAL_ERROR,
  validate, isNotification, result, failure,
  textContent, toolError, initializeResult, dispatch, handleLine
};
