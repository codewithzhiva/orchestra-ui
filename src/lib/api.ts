const BASE = "/api";
const token = () => localStorage.getItem("orchestra_token") ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  };
}

export interface GraphSpec {
  name: string;
  entry: string;
  nodes: NodeSpec[];
  edges: EdgeSpec[];
}

export interface NodeSpec {
  id: string;
  type: "llm" | "http" | "code";
  // llm fields
  model?: string;
  system?: string;
  prompt?: string;
  // http fields
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  bodyTemplate?: string;
  // code fields
  code?: string;
}

export interface EdgeSpec {
  from: string;
  to: string;
}

export interface Graph {
  id: string;
  name: string;
  spec: GraphSpec;
}

export interface Run {
  id: string;
  graphId: string;
  status: "queued" | "running" | "finished" | "failed";
  input: string;
  output: unknown;
  error: string | null;
}

export async function listGraphs(): Promise<Graph[]> {
  const res = await fetch(`${BASE}/graphs`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to list graphs: ${res.status}`);
  return res.json();
}

export async function createGraph(spec: GraphSpec): Promise<Graph> {
  const res = await fetch(`${BASE}/graphs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(spec),
  });
  if (!res.ok) throw new Error(`Failed to create graph: ${await res.text()}`);
  return res.json();
}

export async function deleteGraph(id: string): Promise<void> {
  await fetch(`${BASE}/graphs/${id}`, { method: "DELETE", headers: headers() });
}

export async function createRun(graphId: string, input: string): Promise<Run> {
  const res = await fetch(`${BASE}/runs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ graphId, input }),
  });
  if (!res.ok) throw new Error(`Failed to start run: ${await res.text()}`);
  return res.json();
}

export async function getRun(id: string): Promise<Run> {
  const res = await fetch(`${BASE}/runs/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to get run: ${res.status}`);
  return res.json();
}
