# orchestra-ui

Visual drag-and-drop graph builder for [Orchestra API](https://github.com/codewithzhiva/orchestra-api). Design agent workflows on a canvas, save them, and watch them run with live node status updates.

## Features

- **Three node types** — LLM (Ollama), HTTP (fetch any API), Code (sandboxed JS)
- **Template interpolation** — use `{{input}}` or `{{nodeId}}` in prompts, URLs, and request bodies
- **Live run streaming** — SSE connection to Orchestra shows each node moving from idle → running → done/failed in real time
- **Save & manage graphs** — persisted to Orchestra API, listed in the sidebar
- **Dark theme** — built with Tailwind CSS + React Flow

## Stack

- React 18, TypeScript
- [React Flow (@xyflow/react)](https://reactflow.dev)
- Tailwind CSS v3
- Vite

## Setup

```bash
git clone https://github.com/codewithzhiva/orchestra-ui
cd orchestra-ui
npm install
npm run dev
```

Opens on `http://localhost:5174`. Proxies `/api` to Orchestra API at `http://localhost:3030`.

Paste your Orchestra admin token into the token field in the top-right corner.

## Node types

### LLM node
Calls a local Ollama model. Configure model, system prompt, and user prompt. Supports `{{input}}` and `{{nodeId}}` placeholders.

### HTTP node
Fetches a URL using any HTTP method. URL and request body support template placeholders. Response (JSON or text) is injected into the graph state.

### Code node
Runs sandboxed JavaScript (Node `vm` module). Has access to `input` (string) and `outputs` (Record\<string, string\>). Must assign a value to `result`.

```js
// Example: parse JSON from a previous HTTP node
const data = JSON.parse(outputs.fetch_step);
result = data.items.slice(0, 3).join(', ');
```

## Related projects

- [orchestra-api](https://github.com/codewithzhiva/orchestra-api) — the backend this UI talks to
- [orchestra-mcp](https://github.com/codewithzhiva/orchestra-mcp) — MCP server for Claude Desktop / Cursor

## License

MIT
