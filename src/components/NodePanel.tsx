import { useState } from "react";
import type { NodeType } from "./GraphCanvas.tsx";

interface Props {
  onAddNode: (id: string, type: NodeType, config: Record<string, string>) => void;
}

const NODE_TYPES: { type: NodeType; label: string; color: string }[] = [
  { type: "llm", label: "LLM", color: "border-violet-500 hover:bg-violet-500/10" },
  { type: "http", label: "HTTP", color: "border-sky-500 hover:bg-sky-500/10" },
  { type: "code", label: "Code", color: "border-amber-500 hover:bg-amber-500/10" },
];

export function NodePanel({ onAddNode }: Props) {
  const [type, setType] = useState<NodeType>("llm");
  const [id, setId] = useState("");
  const [prompt, setPrompt] = useState("{{input}}");
  const [system, setSystem] = useState("");
  const [model, setModel] = useState("llama3.1");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [code, setCode] = useState("// Access: input, outputs\n// Must set: result\nresult = input;");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!id.trim()) {
      setError("Node ID required");
      return;
    }
    setError("");
    if (type === "llm") {
      onAddNode(id.trim(), "llm", { prompt, system, model });
    } else if (type === "http") {
      onAddNode(id.trim(), "http", { url, method, bodyTemplate });
    } else {
      onAddNode(id.trim(), "code", { code });
    }
    setId("");
  }

  return (
    <div className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col p-4 gap-4 overflow-y-auto">
      <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400">Add Node</h2>

      {/* Node type selector */}
      <div className="flex gap-2">
        {NODE_TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => setType(t.type)}
            className={`flex-1 py-1.5 text-xs font-semibold border rounded transition-colors ${t.color} ${
              type === t.type ? "opacity-100" : "opacity-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Node ID */}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Node ID</span>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g. summarize"
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
      </label>

      {/* LLM fields */}
      {type === "llm" && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Model</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">System prompt</span>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              rows={2}
              placeholder="You are a helpful assistant."
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">
              Prompt{" "}
              <span className="text-slate-500 text-[10px]">(use {"{{input}}"} or {"{{nodeId}}"})</span>
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none font-mono"
            />
          </label>
        </>
      )}

      {/* HTTP fields */}
      {type === "http" && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">URL (supports {"{{input}}"})</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/{{input}}"
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-400">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          {method !== "GET" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Body template (JSON)</span>
              <textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                rows={3}
                placeholder={'{"query": "{{input}}"}'}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none font-mono"
              />
            </label>
          )}
        </>
      )}

      {/* Code fields */}
      {type === "code" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">
            JS code{" "}
            <span className="text-slate-500 text-[10px]">(assign to `result`)</span>
          </span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={6}
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none font-mono"
          />
        </label>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleAdd}
        className="mt-auto bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2 rounded transition-colors"
      >
        Add Node
      </button>
    </div>
  );
}
