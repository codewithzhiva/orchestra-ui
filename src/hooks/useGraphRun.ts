import { useCallback, useRef, useState } from "react";

export type NodeStatus = "idle" | "running" | "finished" | "failed";

export interface RunEvent {
  type: string;
  node?: string;
  output?: string;
  error?: string;
}

export interface RunState {
  runId: string | null;
  status: "idle" | "queued" | "running" | "finished" | "failed";
  nodeStatuses: Record<string, NodeStatus>;
  output: string | null;
  error: string | null;
  events: RunEvent[];
}

export function useGraphRun() {
  const [state, setState] = useState<RunState>({
    runId: null,
    status: "idle",
    nodeStatuses: {},
    output: null,
    error: null,
    events: [],
  });
  const esRef = useRef<EventSource | null>(null);

  const startRun = useCallback(async (graphId: string, input: string) => {
    // Close any existing stream
    esRef.current?.close();

    setState({
      runId: null,
      status: "queued",
      nodeStatuses: {},
      output: null,
      error: null,
      events: [],
    });

    const token = localStorage.getItem("orchestra_token") ?? "";
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ graphId, input }),
    });

    if (!res.ok) {
      const text = await res.text();
      setState((s) => ({ ...s, status: "failed", error: text }));
      return;
    }

    const { id: runId } = (await res.json()) as { id: string };
    setState((s) => ({ ...s, runId, status: "running" }));

    // Open SSE stream for live node events
    const es = new EventSource(`/api/runs/${runId}/events`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data) as RunEvent;
        setState((s) => {
          const events = [...s.events, ev];
          const nodeStatuses = { ...s.nodeStatuses };

          if (ev.type === "node.started" && ev.node) {
            nodeStatuses[ev.node] = "running";
          } else if (ev.type === "node.finished" && ev.node) {
            nodeStatuses[ev.node] = "finished";
          } else if (ev.type === "node.failed" && ev.node) {
            nodeStatuses[ev.node] = "failed";
          }

          if (ev.type === "run.finished") {
            es.close();
            return { ...s, events, nodeStatuses, status: "finished", output: ev.output as string ?? null };
          }
          if (ev.type === "run.failed") {
            es.close();
            return { ...s, events, nodeStatuses, status: "failed", error: ev.error ?? "unknown error" };
          }

          return { ...s, events, nodeStatuses };
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setState((s) =>
        s.status === "running" ? { ...s, status: "failed", error: "Connection lost" } : s,
      );
    };
  }, []);

  const reset = useCallback(() => {
    esRef.current?.close();
    setState({ runId: null, status: "idle", nodeStatuses: {}, output: null, error: null, events: [] });
  }, []);

  return { state, startRun, reset };
}
