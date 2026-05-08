# AX Analytics SDK for TypeScript

A lightweight TypeScript SDK for sending telemetry events to the AX Go Edge ingestion endpoint. It provides a small `AxAnalytics` wrapper that executes a tool, logs success or error events, and retries telemetry delivery transparently.

## Features

- ESM-compatible TypeScript package
- Fire-and-forget telemetry logging with retry support
- Automatic trace ID generation
- Configurable API key and ingestion URL
- Safety-first timeout and error handling

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

```ts
import { AxAnalytics } from './dist/index.js';

const analytics = new AxAnalytics({
  apiKey: process.env.AX_API_KEY!,
  agentModel: 'my-agent-model',
  baseUrl: 'http://localhost:8080'
});

async function myTool() {
  // your tool logic here
  return { message: 'ok' };
}

async function run() {
  const result = await analytics.wrapTool('my-tool', myTool);
  console.log(result);
}

run().catch(console.error);
```

## API

### `new AxAnalytics(config)`

- `config.apiKey` (string) – required
- `config.agentModel` (string) – optional, defaults to `unknown-model`
- `config.baseUrl` (string) – optional, defaults to `http://localhost:8080`

### `wrapTool(toolName, toolFn)`

Wraps an async function and logs a telemetry event for each execution.

## Notes

- This package is configured as an ECMAScript module with `type: "module"`.
- The telemetry endpoint is expected to accept POST requests at `/v1/ingest`.

## License

MIT
