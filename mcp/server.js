#!/usr/bin/env node
'use strict';

const registry = require('./registry.js');
const { handleLine, failure, INTERNAL_ERROR } = require('./protocol.js');

const MAX_LINE_BYTES = 4 * 1024 * 1024;

function createReader(onLine, onOverflow) {
  let buffer = '';
  return (chunk) => {
    buffer += chunk;
    let index = buffer.indexOf('\n');
    while (index !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      onLine(line);
      index = buffer.indexOf('\n');
    }
    if (buffer.length > MAX_LINE_BYTES) {
      buffer = '';
      onOverflow();
    }
  };
}

function writer(stream) {
  return (message) => {
    if (message === null || message === undefined) return;
    stream.write(JSON.stringify(message) + '\n');
  };
}

function serve(stdin, stdout) {
  const send = writer(stdout);

  const respond = (line) => {
    let response;
    try {
      response = handleLine(line, registry);
    } catch (err) {
      response = failure(null, INTERNAL_ERROR, err.message);
    }
    send(response);
  };

  const overflow = () => {
    send(failure(null, INTERNAL_ERROR, 'input line exceeded the size limit and was discarded'));
  };

  const read = createReader(respond, overflow);

  stdin.setEncoding('utf8');
  stdin.on('data', read);
  stdin.on('error', () => {});
  stdout.on('error', () => {});

  return { respond, read };
}

function main() {
  process.on('uncaughtException', (err) => {
    process.stderr.write(`thwip-mcp uncaught: ${err && err.stack ? err.stack : err}\n`);
  });
  process.on('unhandledRejection', (reason) => {
    process.stderr.write(`thwip-mcp unhandled rejection: ${reason}\n`);
  });

  serve(process.stdin, process.stdout);
  process.stdin.on('end', () => process.exit(0));
  process.stdin.resume();
}

if (require.main === module) main();

module.exports = { MAX_LINE_BYTES, createReader, writer, serve, main };
