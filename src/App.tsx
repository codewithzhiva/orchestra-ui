import { useState, useCallback, useEffect } from "react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
import { GraphCanvas, type NodeType } from "./components/GraphCanvas.tsx";
import { NodePanel } from "./components/NodePanel.tsx";
import { useGraphRun } from "./hooks/useGraphRun.ts";
import { listGraphs, createGraph, deleteGraph, type Graph } from "./lib/api.ts";

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [graphName, setGraphName] = useState("My Agent");
  const [runInput, setRunInput] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("orchestra_token") ?? "");
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const { state: runState, startRun, reset: resetRun } = useGraphRun();

  useEffect(() => {
    localStorage.setItem("orchestra_token", token);
  }, [token]);

  useEffect(() => {
    if (token) listGraphs().then(setGraphs).catch(() => {});
  }, [token]);

  const handleAddNode = useCallback(
    (id: string, type: NodeType, config: Record<string, string>) => {
      const newNode: Node = {
        id,
        type: "orchestra",
        position: { x: 100 + nodes.length * 220, y: 200 },
        data: { label: id, nodeType: type, status: "idle", ...config },
      };
      setNodes((ns) => [...ns, newNode]);
    },
    [nodes.length],
  );

  async function handleSave() {
    if (!nodes.length) return;
    setSaveStatus("saving");
    try {
      const spec = {
        name: graphName,
        entry: nodes[0].id,
        nodes: nodes.map((n) => {
          const d = n.data as Record<string, unknown>;
          return { id: n.id, type: d.nodeType as NodeType, ...d } as never;
        }),
        edges: edges.map((e) => ({ from: e.source, to: e.target })),
      };
      await createGraph(spec);
      setSaveStatus("saved");
      const updated = await listGraphs();
      setGraphs(updated);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleRun(graphId: string) {
    if (!runInput.trim()) return;
    resetRun();
    await startRun(graphId, runInput);
  }

  async function handleDelete(id: string) {
    await deleteGraph(id);
    setGraphs((gs) => gs.filter((g) => g.id !== id));
  }

  const statusColor = {
    idle: "text-slate-400",
    queued: "text-yellow-400",
    running: "text-yellow-300 animate-pulse",
    finished: "text-emerald-400",
    failed: "text-red-400",
  }[runState.status];

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Toolbar */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 shrink-0">
        <span className="text-sm font-bold tracking-wider text-violet-400">ORCHESTRA</span>
        <div className="w-px h-5 bg-slate-700" />
        <input
          value={graphName}
          onChange={(e) => setGraphName(e.target.value)}
          className="bg-transparent text-sm text-white border-b border-transparent hover:border-slate-600 focus:border-violet-500 focus:outline-none px-1 w-40"
        />
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving" || !nodes.length}
          className="ml-1 px-3 py-1 text-xs bg-violet-700 hover:bg-violet-600 disabled:opacity-40 rounded font-semibold transition-colors"
        >
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save Graph"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Token:</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="orchestra admin token"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-48 focus:outline-none focus:border-violet-500"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <ReactFlowProvider>
          <div className="flex-1 relative">
            <GraphCanvas
              nodeStatuses={runState.nodeStatuses}
              onSelectionChange={setSelectedNode}
              onGraphChange={(ns, es) => { setNodes(ns); setEdges(es); }}
            />
            {selectedNode && (
              <div className="absolute top-3 left-3 bg-slate-800/90 border border-slate-600 rounded px-3 py-1.5 text-xs text-slate-300">
                Selected: <span className="text-white font-mono">{selectedNode}</span>
              </div>
            )}
          </div>
        </ReactFlowProvider>

        {/* Right panel */}
        <div className="flex flex-col w-72 border-l border-slate-700 overflow-hidden">
          {/* Add Node panel */}
          <NodePanel onAddNode={handleAddNode} />

          {/* Run panel */}
          <div className="border-t border-slate-700 p-4 flex flex-col gap-3 bg-slate-900">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-400">Run Graph</h2>
            <textarea
              value={runInput}
              onChange={(e) => setRunInput(e.target.value)}
              rows={2}
              placeholder="Enter input for the graph…"
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />

            {/* Saved graphs list */}
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {graphs.length === 0 && (
                <p className="text-xs text-slate-500">No saved graphs yet.</p>
              )}
              {graphs.map((g) => (
                <div key={g.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleRun(g.id)}
                    disabled={runState.status === "running" || runState.status === "queued"}
                    className="flex-1 text-left px-2 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded border border-slate-600 truncate font-mono transition-colors"
                  >
                    ▶ {g.name}
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Run status */}
            {runState.status !== "idle" && (
              <div className="rounded border border-slate-700 bg-slate-800 p-2 text-xs space-y-1">
                <div className={`font-semibold ${statusColor}`}>
                  {runState.status.toUpperCase()}
                  {runState.runId && (
                    <span className="text-slate-500 font-normal ml-2">{runState.runId}</span>
                  )}
                </div>
                {runState.output && (
                  <pre className="text-slate-300 whitespace-pre-wrap break-all max-h-24 overflow-y-auto text-[10px]">
                    {typeof runState.output === "string"
                      ? runState.output
                      : JSON.stringify(runState.output, null, 2)}
                  </pre>
                )}
                {runState.error && (
                  <p className="text-red-400">{runState.error}</p>
                )}
                <button
                  onClick={resetRun}
                  className="text-slate-500 hover:text-slate-300 text-[10px] transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
